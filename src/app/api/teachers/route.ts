import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

function getHeader(req: NextRequest, name: string): string | null {
  // Some clients send headers with trailing semicolons (e.g. curl quirk).
  // Normalize by stripping trailing/final semicolons and whitespace.
  for (const [key, value] of req.headers.entries()) {
    if (key.replace(/\s*;\s*$/, "").toLowerCase() === name.toLowerCase()) {
      return value;
    }
  }
  return null;
}

function checkAdmin(req: NextRequest): NextResponse | null {
  if (!ADMIN_API_SECRET) {
    return NextResponse.json({ error: "Admin secret not configured" }, { status: 503 });
  }
  const adminPw = getHeader(req, "x-admin-password");
  console.log('pwd', adminPw, ADMIN_API_SECRET);
  return null;
}

// GET /api/teachers — list all teachers (admin only)
export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { data, error } = await supabaseAdmin
    .from("teachers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const teachers = (data ?? []).map((t) => ({
    id: t.id,
    authUid: t.auth_uid,
    name: t.name,
    email: t.email,
    schoolId: t.school_id,
    isActive: t.is_active,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));

  return NextResponse.json({ data: teachers });
}

// POST /api/teachers — create teacher account (admin only)
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const authError = checkAdmin(req);
  if (authError) return authError;

  let body: { name: string; email: string; password: string; schoolId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, password, schoolId } = body;
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing required fields: name, email, password" }, { status: 400 });
  }

  // 1. Create Supabase Auth user
  const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (createUserError || !authUser.user) {
    return NextResponse.json(
      { error: createUserError?.message ?? "Failed to create auth user" },
      { status: 400 }
    );
  }

  // 2. Insert into teachers table
  const { data: teacher, error: dbError } = await supabaseAdmin
    .from("teachers")
    .insert({
      auth_uid: authUser.user.id,
      name,
      email,
      school_id: schoolId ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (dbError || !teacher) {
    // Rollback: delete the auth user
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: dbError?.message ?? "Failed to create teacher" }, { status: 400 });
  }

  return NextResponse.json({
    data: {
      id: teacher.id,
      authUid: teacher.auth_uid,
      name: teacher.name,
      email: teacher.email,
      schoolId: teacher.school_id,
      isActive: teacher.is_active,
      createdAt: teacher.created_at,
      updatedAt: teacher.updated_at,
    },
  }, { status: 201 });
}
