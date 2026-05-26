// PATCH /api/teacher/questions/[id]
// DELETE /api/teacher/questions/[id]
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { UpdateQuestionInput } from "@/types/teacher-content";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  // Verify ownership via join
  const { data: question, error: qError } = await supabaseAdmin!
    .from("teacher_questions")
    .select("id, set_id, teacher_question_sets!inner(created_by)")
    .eq("id", id)
    .single();

  if (qError || !question) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const set = question as unknown as { id: string; set_id: string; teacher_question_sets: { created_by: string } };
  if (set.teacher_question_sets.created_by !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: UpdateQuestionInput;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { question: q, option_a, option_b, option_c, correct_option, explanation, is_active } = body;
  const updates: Record<string, unknown> = {};
  if (q !== undefined) updates.question = q;
  if (option_a !== undefined) updates.option_a = option_a;
  if (option_b !== undefined) updates.option_b = option_b;
  if (option_c !== undefined) updates.option_c = option_c;
  if (correct_option !== undefined) {
    if (!["A", "B", "C"].includes(correct_option)) {
      return NextResponse.json({ error: "correct_option must be A, B, or C" }, { status: 400 });
    }
    updates.correct_option = correct_option;
  }
  if (explanation !== undefined) updates.explanation = explanation;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await supabaseAdmin!
    .from("teacher_questions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Update failed" }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  // Verify ownership
  const { data: question, error: qError } = await supabaseAdmin!
    .from("teacher_questions")
    .select("id, teacher_question_sets!inner(created_by)")
    .eq("id", id)
    .single();

  if (qError || !question) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const q = question as unknown as { id: string; teacher_question_sets: { created_by: string } };
  if (q.teacher_question_sets.created_by !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Soft-delete
  await supabaseAdmin!
    .from("teacher_questions")
    .update({ is_active: false })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
