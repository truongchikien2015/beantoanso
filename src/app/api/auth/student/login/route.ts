// POST /api/auth/student/login — Self-registered student auth (Supabase Auth + profiles)
// Register if not exists (isLogin=false), then login. Bypasses email confirmation
// using the service role API. This is the student equivalent of the member auth flow.
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function supabaseFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      ...(options.headers ?? {}),
    },
  });
  return res;
}

async function readSupabaseError(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body.msg || body.error_description || body.message || body.error || fallback;
  } catch {
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  let body: {
    email: string;
    password: string;
    isLogin: boolean;
    fullName?: string;
    gender?: string;
    birthYear?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email, password, isLogin, fullName, gender, birthYear } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Thiếu email hoặc mật khẩu" }, { status: 400 });
  }

  let access_token = "";
  let refresh_token = "";
  let userId = "";

  if (isLogin) {
    // Login existing student
    const authRes = await supabaseFetch("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email, password, gotrue_meta_security: {} }),
    });

    if (!authRes.ok) {
      const errMsg = await readSupabaseError(authRes, "Email hoặc mật khẩu không đúng");
      return NextResponse.json({ error: errMsg }, { status: 401 });
    }

    const authData = await authRes.json();
    access_token = authData.access_token;
    refresh_token = authData.refresh_token;
    userId = authData.user.id;
  } else {
    // Registration: create user with email_confirm=true (no confirmation email needed)
    let createRes = await supabaseFetch("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName ?? null,
          gender: gender ?? null,
          birth_year: birthYear ?? null,
        },
      }),
    });

    let fallbackToPublic = false;

    if (!createRes.ok) {
      const errMsg = await readSupabaseError(createRes.clone(), "");
      if (
        createRes.status === 409 ||
        errMsg.includes("Email đã được sử dụng") ||
        errMsg.includes("already registered")
      ) {
        return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
      }

      // If SUPABASE_SERVICE_ROLE_KEY is missing or points at the anon key in
      // production, Supabase rejects admin user creation with "User not allowed".
      // Public signup still works with the anon key, so use it as a compatibility
      // fallback instead of blocking student registration.
      if (
        createRes.status === 400 ||
        createRes.status === 403 ||
        errMsg.includes("User not allowed") ||
        errMsg.includes("not allowed")
      ) {
        fallbackToPublic = true;
      } else {
        return NextResponse.json({ error: errMsg || "Không thể tạo tài khoản" }, { status: 400 });
      }
    }

    if (fallbackToPublic) {
      createRes = await supabaseFetch("/auth/v1/signup", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          data: {
            full_name: fullName ?? null,
            gender: gender ?? null,
            birth_year: birthYear ?? null,
          },
        }),
      });

      if (!createRes.ok) {
        const errMsg = await readSupabaseError(createRes, "Không thể tạo tài khoản");
        if (createRes.status === 409 || errMsg.includes("already registered")) {
          return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
        }
        if (errMsg.toLowerCase().includes("rate limit") || createRes.status === 429) {
          return NextResponse.json({
            error: "Tần suất đăng ký quá nhanh (giới hạn bảo mật của Supabase). Vui lòng cấu hình khóa SUPABASE_SERVICE_ROLE_KEY chính xác trong tệp .env để bỏ giới hạn, hoặc vui lòng thử lại sau vài phút.",
          }, { status: 429 });
        }
        return NextResponse.json({ error: errMsg }, { status: 400 });
      }
    }

    const createData = await createRes.json();
    const createdUserId = createData.user?.id ?? createData.id;

    // Immediately login the new student
    const authRes = await supabaseFetch("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email, password, gotrue_meta_security: {} }),
    });

    if (!authRes.ok) {
      userId = createdUserId;
      const errMsg = await readSupabaseError(authRes.clone(), "");
      console.warn("[student-login-on-signup] Password login failed, proceeding with profile creation:", errMsg);
    } else {
      const authData = await authRes.json();
      access_token = authData.access_token;
      refresh_token = authData.refresh_token;
      userId = authData.user?.id;
    }

    if (!userId) {
      if (createdUserId && !fallbackToPublic) {
        await supabaseFetch(`/auth/v1/admin/users/${createdUserId}`, { method: "DELETE" });
      }
      return NextResponse.json({ error: "Không thể xác thực tài khoản vừa tạo" }, { status: 500 });
    }

    if (createdUserId && createdUserId !== userId) {
      if (!fallbackToPublic) {
        await supabaseFetch(`/auth/v1/admin/users/${createdUserId}`, { method: "DELETE" });
      }
      return NextResponse.json({ error: "Thông tin tài khoản không khớp sau khi đăng ký" }, { status: 500 });
    }

    // Create profile
    const profile = {
      id: userId,
      full_name: fullName ?? null,
      gender: gender ?? null,
      birth_year: birthYear ?? null ? parseInt(String(birthYear), 10) : null,
      xp: 0,
      level: 1,
      total_score: 0,
    };

    const profileRes = await supabaseFetch("/rest/v1/profiles?on_conflict=id", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(profile),
    });

    if (!profileRes.ok) {
      if (!fallbackToPublic && createdUserId) {
        await supabaseFetch(`/auth/v1/admin/users/${createdUserId}`, { method: "DELETE" });
      }
      const errMsg = await readSupabaseError(profileRes, "Không thể tạo hồ sơ người dùng");
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }
  }

  // Get profile
  let profile = null;
  if (userId) {
    const profileRes = await supabaseFetch(
      `/rest/v1/profiles?id=eq.${userId}&select=*`
    );
    const profiles = await profileRes.json();
    profile = Array.isArray(profiles) ? profiles[0] : null;
  }

  return NextResponse.json({ access_token, refresh_token, user: { id: userId, email }, profile });
}
