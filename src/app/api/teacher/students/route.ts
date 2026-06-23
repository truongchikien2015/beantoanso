// GET /api/teacher/students — list all students for the authenticated teacher
// POST /api/teacher/students — import students (bulk)
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { ImportStudentInput, ImportResult } from "@/types/teacher-content";

// GET /api/teacher/students
export async function GET(req: NextRequest) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;

  await connectDB();

  const data = await TeacherStudent.find({ created_by: uid, is_active: true })
    .sort({ created_at: -1 })
    .select("-password_hash")
    .lean();

  const students = data.map((s) => ({
    id: s._id.toString(),
    created_by: s.created_by,
    nickname: s.nickname,
    email: s.email,
    class_name: s.class_name,
    student_code: s.student_code,
    parent_access_code: s.parent_access_code ?? null,
    assigned_path_id: s.assigned_path_id?.toString() ?? null,
    assigned_at: s.assigned_at,
    is_active: s.is_active,
    created_at: s.created_at,
    updated_at: s.updated_at,
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

  await connectDB();

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

      // Check for duplicate student_code
      const existing = await TeacherStudent.findOne({ student_code: s.student_code }).lean();
      if (existing) {
        errors.push({ row, message: `Mã học sinh "${s.student_code}" đã tồn tại` });
        continue;
      }

      const doc = await TeacherStudent.create({
        created_by: uid,
        nickname: s.nickname,
        email: s.email ?? null,
        class_name: s.class_name ?? null,
        student_code: s.student_code,
        parent_access_code: null,
        password_hash: hash,
        is_active: true,
      });

      results.push({ nickname: doc.nickname, student_code: doc.student_code, password: s.password });
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
