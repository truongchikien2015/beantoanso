// GET /api/teacher/learning-paths/[id]/steps — list steps
// POST /api/teacher/learning-paths/[id]/steps — add a step
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherLearningPath } from "@/lib/db/models/TeacherLearningPath";
import { TeacherLearningPathStep } from "@/lib/db/models/TeacherLearningPathStep";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { CreatePathStepInput } from "@/types/teacher-content";

type RouteContext = { params: Promise<{ id: string }> };

async function verifyPathOwnership(pathId: string, uid: string): Promise<NextResponse | null> {
  const data = await TeacherLearningPath.findOne({ _id: pathId, created_by: uid }).lean();
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return null;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id: pathId } = await context.params;

  await connectDB();

  const notFound = await verifyPathOwnership(pathId, uid);
  if (notFound) return notFound;

  const steps = await TeacherLearningPathStep.find({ path_id: pathId })
    .sort({ step_order: 1 })
    .lean();

  const mapped = steps.map((s) => ({
    id: s._id.toString(), path_id: s.path_id.toString(),
    step_order: s.step_order, step_type: s.step_type,
    topic_id: s.topic_id, question_set_id: s.question_set_id?.toString() ?? null,
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id: pathId } = await context.params;

  await connectDB();

  const notFound = await verifyPathOwnership(pathId, uid);
  if (notFound) return notFound;

  let body: CreatePathStepInput;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { step_order, step_type, topic_id, question_set_id } = body;
  if (!step_order || !step_type) {
    return NextResponse.json({ error: "Missing required fields: step_order, step_type" }, { status: 400 });
  }

  if (!["topic", "question_set"].includes(step_type)) {
    return NextResponse.json({ error: "step_type must be 'topic' or 'question_set'" }, { status: 400 });
  }

  if (step_type === "topic" && !topic_id) {
    return NextResponse.json({ error: "topic_id required when step_type is 'topic'" }, { status: 400 });
  }
  if (step_type === "question_set" && !question_set_id) {
    return NextResponse.json({ error: "question_set_id required when step_type is 'question_set'" }, { status: 400 });
  }

  const insertData: Record<string, unknown> = { path_id: pathId, step_order, step_type };
  if (topic_id) insertData.topic_id = topic_id;
  if (question_set_id) insertData.question_set_id = question_set_id;

  const doc = await TeacherLearningPathStep.create(insertData);

  return NextResponse.json({
    id: doc._id.toString(), path_id: doc.path_id.toString(),
    step_order: doc.step_order, step_type: doc.step_type,
    topic_id: doc.topic_id, question_set_id: doc.question_set_id?.toString() ?? null,
  }, { status: 201 });
}
