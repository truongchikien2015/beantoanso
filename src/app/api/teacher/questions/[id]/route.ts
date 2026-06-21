// PATCH /api/teacher/questions/[id]
// DELETE /api/teacher/questions/[id]
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherQuestion } from "@/lib/db/models/TeacherQuestion";
import { TeacherQuestionSet } from "@/lib/db/models/TeacherQuestionSet";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { UpdateQuestionInput } from "@/types/teacher-content";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  await connectDB();

  // Find question and verify ownership via set
  const question = await TeacherQuestion.findById(id).lean();
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const set = await TeacherQuestionSet.findOne({ _id: question.set_id, created_by: uid }).lean();
  if (!set) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  const data = await TeacherQuestion.findByIdAndUpdate(id, updates, { new: true }).lean();
  if (!data) return NextResponse.json({ error: "Update failed" }, { status: 400 });

  return NextResponse.json({
    id: data._id.toString(),
    set_id: data.set_id.toString(),
    question: data.question,
    option_a: data.option_a,
    option_b: data.option_b,
    option_c: data.option_c,
    correct_option: data.correct_option,
    explanation: data.explanation,
    is_active: data.is_active,
  });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  await connectDB();

  const question = await TeacherQuestion.findById(id).lean();
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const set = await TeacherQuestionSet.findOne({ _id: question.set_id, created_by: uid }).lean();
  if (!set) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Soft-delete
  await TeacherQuestion.findByIdAndUpdate(id, { is_active: false });

  return NextResponse.json({ success: true });
}
