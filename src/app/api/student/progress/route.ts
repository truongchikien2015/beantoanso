// GET /api/student/progress — get all progress for current student
// DELETE /api/student/progress — reset progress for current student
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

  const { data, error } = await supabaseAdmin
    .from("teacher_student_progress")
    .select("id, student_id, path_id, step_id, score, completed_at")
    .eq("student_id", studentId)
    .order("completed_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ progress: data ?? [], stats });
}

export async function DELETE(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const session = getStudentId(req);
  if (session instanceof NextResponse) return session;

  const { studentId } = session;

  const { error } = await supabaseAdmin
    .from("teacher_student_progress")
    .delete()
    .eq("student_id", studentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
