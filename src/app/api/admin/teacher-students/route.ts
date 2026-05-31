// GET /api/admin/teacher-students — list ALL students created/imported by teachers (admin only)
// These accounts live in `teacher_students` and authenticate with a teacher-assigned
// code + password. Admin sees every teacher's students across the whole system.
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/admin/teacher-students
export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const authError = checkAdmin(req);
  if (authError) return authError;

  // 1. Fetch every teacher-created student, with their assigned path title.
  const { data: students, error: studentsError } = await supabaseAdmin
    .from("teacher_students")
    .select(
      "id, created_by, nickname, email, class_name, student_code, assigned_path_id, assigned_at, is_active, created_at, updated_at, teacher_learning_paths(id, title)"
    )
    .order("created_at", { ascending: false });

  if (studentsError) {
    return NextResponse.json({ error: studentsError.message }, { status: 500 });
  }

  // 2. Resolve teacher names. teacher_students.created_by → auth.users.id,
  //    which maps to teachers.auth_uid (no direct FK, so join in code).
  const { data: teachers, error: teachersError } = await supabaseAdmin
    .from("teachers")
    .select("auth_uid, name, email");

  if (teachersError) {
    return NextResponse.json({ error: teachersError.message }, { status: 500 });
  }

  const teacherByUid = new Map(
    (teachers ?? []).map((t) => [t.auth_uid, { name: t.name, email: t.email }])
  );

  const result = (students ?? []).map((s) => {
    const teacher = teacherByUid.get(s.created_by);
    const path = Array.isArray(s.teacher_learning_paths)
      ? s.teacher_learning_paths[0]
      : s.teacher_learning_paths;
    return {
      id: s.id,
      nickname: s.nickname,
      email: s.email,
      className: s.class_name,
      studentCode: s.student_code,
      assignedPathId: s.assigned_path_id,
      assignedPathTitle: path?.title ?? null,
      assignedAt: s.assigned_at,
      isActive: s.is_active,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      teacherName: teacher?.name ?? null,
      teacherEmail: teacher?.email ?? null,
    };
  });

  return NextResponse.json({ data: result });
}
