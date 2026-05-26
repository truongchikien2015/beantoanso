// GET /api/teacher/students — list all students for the authenticated teacher
// POST /api/teacher/students — import students (bulk)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { ImportStudentInput, ImportResult } from "@/types/teacher-content";

// GET /api/teacher/students
export async function GET(req: NextRequest) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;

  const { data, error } = await supabaseAdmin!
    .from("teacher_students")
    .select("*, teacher_learning_paths(id, title)")
    .eq("created_by", uid)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const students = (data ?? []).map((s) => ({
    id: s.id, created_by: s.created_by, nickname: s.nickname,
    email: s.email, class_name: s.class_name, student_code: s.student_code,
    assigned_path_id: s.assigned_path_id, assigned_at: s.assigned_at,
    is_active: s.is_active, created_at: s.created_at, updated_at: s.updated_at,
    // Strip password_hash
  }));

  return NextResponse.json(students);
}

// POST /api/teacher/students — bulk import
export async function POST(req: NextRequest) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;

  let body: { students: ImportStudentInput[] };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { students } = body;
  if (!Array.isArray(students) || students.length === 0) {
    return NextResponse.json({ error: "students array required" }, { status: 400 });
  }

  // Hash passwords with bcryptjs
  const bcrypt = await import("bcryptjs");
  const results: Array<{ nickname: string; student_code: string; password: string }> = [];
  const errors: Array<{ row: number; message: string }> = [];

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const row = i + 1;

    if (!s.nickname || !s.student_code || !s.password) {
      errors.push({ row, message: "Thiếu nickname, student_code hoặc password" });
      continue;
    }

    try {
      const hash = await bcrypt.hash(s.password, 10);
      const { data, error } = await supabaseAdmin!
        .from("teacher_students")
        .insert({
          created_by: uid,
          nickname: s.nickname,
          email: s.email ?? null,
          class_name: s.class_name ?? null,
          student_code: s.student_code,
          password_hash: hash,
          is_active: true,
        })
        .select("id, nickname, student_code")
        .single();

      if (error) {
        if (error.code === "23505") {
          errors.push({ row, message: `Mã học sinh "${s.student_code}" đã tồn tại` });
        } else {
          errors.push({ row, message: error.message });
        }
        continue;
      }

      results.push({ nickname: data.nickname, student_code: data.student_code, password: s.password });
    } catch {
      errors.push({ row, message: "Lỗi băm mật khẩu" });
    }
  }

  const importResult: ImportResult = {
    total: students.length,
    success: results.length,
    failed: errors.length,
    errors,
  };

  return NextResponse.json({
    result: importResult,
    created: results,
  }, { status: results.length > 0 ? 201 : 200 });
}
