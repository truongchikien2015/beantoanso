// GET /api/teacher/learning-paths/[id]
// PATCH /api/teacher/learning-paths/[id]
// DELETE /api/teacher/learning-paths/[id]
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { UpdateLearningPathInput } from "@/types/teacher-content";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  const { data, error } = await supabaseAdmin!
    .from("teacher_learning_paths")
    .select("*, teacher_learning_path_steps(*)")
    .eq("id", id)
    .eq("created_by", uid)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const steps = (data.teacher_learning_path_steps ?? [])
    .sort((a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order);

  return NextResponse.json({
    id: data.id, created_by: data.created_by, title: data.title,
    description: data.description, is_active: data.is_active,
    created_at: data.created_at, updated_at: data.updated_at,
    steps,
  });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  let body: UpdateLearningPathInput;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, is_active } = body;
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await supabaseAdmin!
    .from("teacher_learning_paths")
    .update(updates)
    .eq("id", id)
    .eq("created_by", uid)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });

  return NextResponse.json({
    id: data.id, created_by: data.created_by, title: data.title,
    description: data.description, is_active: data.is_active,
    created_at: data.created_at, updated_at: data.updated_at,
  });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  const { error } = await supabaseAdmin!
    .from("teacher_learning_paths")
    .update({ is_active: false })
    .eq("id", id)
    .eq("created_by", uid);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
