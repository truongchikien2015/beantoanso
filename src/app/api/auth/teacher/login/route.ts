// POST /api/auth/teacher/login — Teacher auth: register if not exists, then login
// Supports bypass email confirmation via service role API
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
    // Try to login existing user
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
    const createRes = await supabaseFetch("/auth/v1/admin/users", {
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

    if (!createRes.ok && createRes.status !== 409) {
      const errMsg = await readSupabaseError(createRes, "Không thể tạo tài khoản");
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    if (createRes.status === 409) {
      return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
    }

    const createData = await createRes.json();
    const createdUserId = createData.user?.id ?? createData.id;

    // Immediately login the new user
    const authRes = await supabaseFetch("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email, password, gotrue_meta_security: {} }),
    });

    if (!authRes.ok) {
      return NextResponse.json({ error: "Tạo tài khoản thành công nhưng không thể đăng nhập" }, { status: 401 });
    }

    const authData = await authRes.json();
    access_token = authData.access_token;
    refresh_token = authData.refresh_token;
    userId = authData.user?.id;

    if (!userId) {
      if (createdUserId) {
        await supabaseFetch(`/auth/v1/admin/users/${createdUserId}`, { method: "DELETE" });
      }
      return NextResponse.json({ error: "Không thể xác thực tài khoản vừa tạo" }, { status: 500 });
    }

    if (createdUserId && createdUserId !== userId) {
      await supabaseFetch(`/auth/v1/admin/users/${createdUserId}`, { method: "DELETE" });
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
      await supabaseFetch(`/auth/v1/admin/users/${userId}`, { method: "DELETE" });
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
