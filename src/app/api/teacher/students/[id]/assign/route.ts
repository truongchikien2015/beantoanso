// POST /api/teacher/students/[id]/assign — assign a learning path to a student
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTeacherUid } from "@/lib/auth-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id: studentId } = await context.params;

  let body: { path_id: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { path_id } = body;
  if (!path_id) return NextResponse.json({ error: "path_id required" }, { status: 400 });

  // Verify student belongs to this teacher
  const { data: student, error: studentError } = await supabaseAdmin!
    .from("teacher_students")
    .select("id")
    .eq("id", studentId)
    .eq("created_by", uid)
    .single();

  if (studentError || !student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Verify path belongs to this teacher
  const { data: path, error: pathError } = await supabaseAdmin!
    .from("teacher_learning_paths")
    .select("id")
    .eq("id", path_id)
    .eq("created_by", uid)
    .single();

  if (pathError || !path) {
    return NextResponse.json({ error: "Learning path not found" }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin!
    .from("teacher_students")
    .update({ assigned_path_id: path_id, assigned_at: new Date().toISOString() })
    .eq("id", studentId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    id: data.id, created_by: data.created_by, nickname: data.nickname,
    email: data.email, class_name: data.class_name, student_code: data.student_code,
    assigned_path_id: data.assigned_path_id, assigned_at: data.assigned_at,
    is_active: data.is_active, created_at: data.created_at, updated_at: data.updated_at,
  });
}
