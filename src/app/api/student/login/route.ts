// POST /api/student/login — Student login with code + password
// GET /api/student/login — Get current student info
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { StudentLoginInput } from "@/types/teacher-content";
import { createStudentToken, verifyStudentToken } from "@/lib/auth-helpers";

// POST /api/student/login
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  let body: StudentLoginInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { student_code, password } = body;
  const loginId = student_code?.trim();
  if (!loginId || !password) {
    return NextResponse.json({ error: "Missing student_code or password" }, { status: 400 });
  }

  const baseStudentQuery = () =>
    supabaseAdmin
      .from("teacher_students")
      .select("id, nickname, email, class_name, student_code, assigned_path_id, assigned_at, password_hash, is_active")
      .eq("is_active", true);

  let { data: student, error } = await baseStudentQuery()
    .eq("student_code", loginId)
    .maybeSingle();

  if (!student && loginId.includes("@")) {
    const byEmail = await baseStudentQuery()
      .eq("email", loginId.toLowerCase())
      .limit(1)
      .maybeSingle();
    student = byEmail.data;
    error = byEmail.error;
  }

  if (error || !student) {
    return NextResponse.json({ error: "Mã học sinh/email hoặc mật khẩu không đúng" }, { status: 401 });
  }

  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(password, student.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Mã học sinh/email hoặc mật khẩu không đúng" }, { status: 401 });
  }

  const token = createStudentToken(student.id);

  return NextResponse.json({
    token,
    student: {
      id: student.id,
      nickname: student.nickname,
      email: student.email,
      class_name: student.class_name,
      student_code: student.student_code,
      assigned_path_id: student.assigned_path_id,
    },
  });
}

// GET /api/student/login
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = auth.slice(7);
  const session = verifyStudentToken(token);
  if (!session) {
    return NextResponse.json({ error: "Token không hợp lệ hoặc đã hết hạn" }, { status: 401 });
  }

  const { data: student, error } = await supabaseAdmin!
    .from("teacher_students")
    .select("id, nickname, email, class_name, student_code, assigned_path_id, assigned_at")
    .eq("id", session.studentId)
    .eq("is_active", true)
    .single();

  if (error || !student) return NextResponse.json({ error: "Không tìm thấy học sinh" }, { status: 404 });

  let assigned_path = null;
  if (student.assigned_path_id) {
    const { data: path } = await supabaseAdmin!
      .from("teacher_learning_paths")
      .select("id, title, description")
      .eq("id", student.assigned_path_id)
      .single();

    if (path) {
      const { data: steps } = await supabaseAdmin!
        .from("teacher_learning_path_steps")
        .select("id, step_order, step_type, topic_id, question_set_id")
        .eq("path_id", path.id)
        .order("step_order", { ascending: true });

      assigned_path = { ...path, steps: steps ?? [] };
    }
  }

  return NextResponse.json({ student, assigned_path });
}
