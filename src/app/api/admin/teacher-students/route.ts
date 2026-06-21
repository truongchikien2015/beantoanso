// GET /api/admin/teacher-students — list ALL students created/imported by teachers (admin only)
// These accounts live in `teacher_students` and authenticate with a teacher-assigned
// code + password. Admin sees every teacher's students across the whole system.
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
import { Teacher } from "@/lib/db/models/Teacher";
import { TeacherLearningPath } from "@/lib/db/models/TeacherLearningPath";

// GET /api/admin/teacher-students
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  await connectDB();

  // 1. Fetch every teacher-created student.
  const students = await TeacherStudent.find({} as any).sort({ created_at: -1 } as any).lean();

  // 2. Resolve teacher names.
  const teachers = await Teacher.find({} as any).select("auth_uid name email").lean();
  const teacherByUid = new Map(
    teachers.map((t) => [t.auth_uid, { name: t.name, email: t.email }])
  );

  // 3. Resolve path titles.
  const paths = await TeacherLearningPath.find({} as any).select("title").lean();
  const pathById = new Map(
    paths.map((p) => [p._id.toString(), p.title])
  );

  const result = students.map((s) => {
    const teacher = teacherByUid.get(s.created_by);
    const pathTitle = s.assigned_path_id ? pathById.get(s.assigned_path_id.toString()) : null;
    return {
      id: s._id.toString(),
      nickname: s.nickname,
      email: s.email,
      className: s.class_name,
      studentCode: s.student_code,
      assignedPathId: s.assigned_path_id?.toString() ?? null,
      assignedPathTitle: pathTitle ?? null,
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
