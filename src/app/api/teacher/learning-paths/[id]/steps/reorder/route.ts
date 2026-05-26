// PUT /api/teacher/learning-paths/[id]/steps/reorder
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTeacherUid } from "@/lib/auth-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id: pathId } = await context.params;

  // Verify path ownership
  const { data: path, error: pathError } = await supabaseAdmin!
    .from("teacher_learning_paths")
    .select("id")
    .eq("id", pathId)
    .eq("created_by", uid)
    .single();

  if (pathError || !path) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { steps: { id: string; step_order: number }[] };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { steps } = body;
  if (!Array.isArray(steps) || steps.length === 0) {
    return NextResponse.json({ error: "steps array required" }, { status: 400 });
  }

  // Update each step's order
  const updates = steps.map((s) =>
    supabaseAdmin!
      .from("teacher_learning_path_steps")
      .update({ step_order: s.step_order })
      .eq("id", s.id)
      .eq("path_id", pathId)
  );

  await Promise.all(updates);

  return NextResponse.json({ success: true });
}
