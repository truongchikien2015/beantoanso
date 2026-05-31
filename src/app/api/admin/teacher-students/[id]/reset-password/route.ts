// POST /api/admin/teacher-students/[id]/reset-password — reset a teacher-created student's password (admin only)
// These students authenticate with a bcrypt-hashed password stored in teacher_students.
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { id } = await context.params;

  let body: { newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const newPassword = body.newPassword?.trim();
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "Mật khẩu phải có ít nhất 6 ký tự" }, { status: 400 });
  }

  // Admin can reset any teacher's student (no created_by filter).
  const { data: student, error: fetchError } = await supabaseAdmin
    .from("teacher_students")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !student) {
    return NextResponse.json({ error: "Không tìm thấy học sinh" }, { status: 404 });
  }

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const { error: updateError } = await supabaseAdmin
    .from("teacher_students")
    .update({ password_hash: passwordHash })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
