// GET /api/student/dashboard — student info, assigned path, steps, progress
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getStudentId } from "@/lib/auth-helpers";
import { ensureStudentStats } from "@/lib/server/studentRewards";

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const session = getStudentId(req);
  if (session instanceof NextResponse) return session;

  const { studentId } = session;
  const stats = await ensureStudentStats(studentId);

  // Get student info
  const { data: student, error: studentError } = await supabaseAdmin
    .from("teacher_students")
    .select("id, nickname, email, class_name, student_code, assigned_path_id")
    .eq("id", studentId)
    .eq("is_active", true)
    .single();

  if (studentError || !student) {
    return NextResponse.json({ error: "Không tìm thấy học sinh" }, { status: 404 });
  }

  // No assigned path → return empty
  if (!student.assigned_path_id) {
    return NextResponse.json({
      student,
      assigned_path: null,
      progress: [],
      stats,
    });
  }

  // Get assigned path with steps
  const { data: path } = await supabaseAdmin
    .from("teacher_learning_paths")
    .select("id, title, description, created_at")
    .eq("id", student.assigned_path_id)
    .eq("is_active", true)
    .single();

  if (!path) {
    return NextResponse.json({
      student,
      assigned_path: null,
      progress: [],
      stats,
    });
  }

  // Get steps in order
  const { data: steps } = await supabaseAdmin
    .from("teacher_learning_path_steps")
    .select("id, path_id, step_order, step_type, topic_id, question_set_id")
    .eq("path_id", path.id)
    .order("step_order", { ascending: true });

  // Get progress for this student + path
  const { data: progress } = await supabaseAdmin
    .from("teacher_student_progress")
    .select("id, student_id, path_id, step_id, score, completed_at")
    .eq("student_id", studentId)
    .eq("path_id", path.id);

  return NextResponse.json({
    student,
    assigned_path: {
      ...path,
      steps: steps ?? [],
      step_count: (steps ?? []).length,
    },
    progress: progress ?? [],
    stats,
  });
}
