// POST /api/teacher/learning-paths/[id]/assign-students — assign a learning path to multiple students
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTeacherUid } from "@/lib/auth-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;
  const { id: pathId } = await context.params;

  let body: { studentIds: string[] };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { studentIds } = body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return NextResponse.json({ error: "studentIds must be a non-empty array" }, { status: 400 });
  }

  // Verify path belongs to this teacher
  const { data: path, error: pathError } = await supabaseAdmin!
    .from("teacher_learning_paths")
    .select("id, title")
    .eq("id", pathId)
    .eq("created_by", uid)
    .single();

  if (pathError || !path) {
    return NextResponse.json({ error: "Learning path not found" }, { status: 404 });
  }

  // Verify all students belong to this teacher
  const { data: students, error: studentsError } = await supabaseAdmin!
    .from("teacher_students")
    .select("id")
    .eq("created_by", uid)
    .in("id", studentIds);

  if (studentsError) {
    return NextResponse.json({ error: studentsError.message }, { status: 400 });
  }

  const validStudentIds = (students ?? []).map((s: { id: string }) => s.id);
  const now = new Date().toISOString();

  // Batch update all students
  const { data: updated, error: updateError } = await supabaseAdmin!
    .from("teacher_students")
    .update({ assigned_path_id: pathId, assigned_at: now })
    .in("id", validStudentIds)
    .select();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    pathId,
    pathTitle: path.title,
    assignedCount: validStudentIds.length,
    students: updated,
  });
}
