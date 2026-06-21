// GET /api/teacher/question-sets/[id]/questions
// POST /api/teacher/question-sets/[id]/questions
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherQuestionSet } from "@/lib/db/models/TeacherQuestionSet";
import { TeacherQuestion } from "@/lib/db/models/TeacherQuestion";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { CreateQuestionInput } from "@/types/teacher-content";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id: setId } = await context.params;

  await connectDB();

  // Verify ownership
  const set = await TeacherQuestionSet.findOne({ _id: setId, created_by: uid }).lean();
  if (!set) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const questions = await TeacherQuestion.find({ set_id: setId, is_active: true })
    .sort({ created_at: 1 })
    .lean();

  const mapped = questions.map((q) => ({
    id: q._id.toString(),
    set_id: q.set_id.toString(),
    question: q.question,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    correct_option: q.correct_option,
    explanation: q.explanation,
    is_active: q.is_active,
    created_at: q.created_at,
    updated_at: q.updated_at,
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id: setId } = await context.params;

  await connectDB();

  // Verify ownership
  const set = await TeacherQuestionSet.findOne({ _id: setId, created_by: uid }).lean();
  if (!set) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: CreateQuestionInput;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { question, option_a, option_b, option_c, correct_option, explanation } = body;
  if (!question || !option_a || !option_b || !option_c || !correct_option) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["A", "B", "C"].includes(correct_option)) {
    return NextResponse.json({ error: "correct_option must be A, B, or C" }, { status: 400 });
  }

  const doc = await TeacherQuestion.create({
    set_id: setId,
    question,
    option_a,
    option_b,
    option_c,
    correct_option,
    explanation: explanation ?? null,
  });

  return NextResponse.json({
    id: doc._id.toString(),
    set_id: doc.set_id.toString(),
    question: doc.question,
    option_a: doc.option_a,
    option_b: doc.option_b,
    option_c: doc.option_c,
    correct_option: doc.correct_option,
    explanation: doc.explanation,
    is_active: doc.is_active,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  }, { status: 201 });
}
