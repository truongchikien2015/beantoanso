// DELETE /api/teacher/students/[id] — soft-delete a student
// GET /api/teacher/students/[id] — get a single student
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTeacherUid } from "@/lib/auth-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  const { data, error } = await supabaseAdmin!
    .from("teacher_students")
    .select("*, teacher_learning_paths(id, title)")
    .eq("id", id)
    .eq("created_by", uid)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: data.id, created_by: data.created_by, nickname: data.nickname,
    email: data.email, class_name: data.class_name, student_code: data.student_code,
    assigned_path_id: data.assigned_path_id, assigned_at: data.assigned_at,
    is_active: data.is_active, created_at: data.created_at, updated_at: data.updated_at,
  });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  const { error } = await supabaseAdmin!
    .from("teacher_students")
    .update({ is_active: false })
    .eq("id", id)
    .eq("created_by", uid);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
