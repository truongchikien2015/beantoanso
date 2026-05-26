// DELETE /api/teacher/steps/[id]
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTeacherUid } from "@/lib/auth-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  // Verify ownership via path
  const { data: step, error } = await supabaseAdmin!
    .from("teacher_learning_path_steps")
    .select("id, path_id, teacher_learning_paths!inner(created_by)")
    .eq("id", id)
    .single();

  if (error || !step) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const s = step as unknown as { id: string; path_id: string; teacher_learning_paths: { created_by: string } };
  if (s.teacher_learning_paths.created_by !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabaseAdmin!.from("teacher_learning_path_steps").delete().eq("id", id);

  return NextResponse.json({ success: true });
}
