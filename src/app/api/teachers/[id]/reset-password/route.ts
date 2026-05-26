import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

function getHeader(req: NextRequest, name: string): string | null {
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
  return null;
}

type Params = { params: Promise<{ id: string }> };

// POST /api/teachers/[id]/reset-password — admin resets teacher password
export async function POST(req: NextRequest, { params }: Params) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { id } = await params;

  let body: { newPassword: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { newPassword } = body;
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  // Fetch teacher auth_uid
  const { data: teacher, error: fetchError } = await supabaseAdmin
    .from("teachers")
    .select("auth_uid, name")
    .eq("id", id)
    .single();

  if (fetchError || !teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  // Update password via Supabase Admin Auth
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    teacher.auth_uid,
    { password: newPassword }
  );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({
    data: { message: `Password reset for ${teacher.name}` },
  });
}
