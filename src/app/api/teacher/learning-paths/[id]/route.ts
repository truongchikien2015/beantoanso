// GET /api/teacher/learning-paths/[id]
// PATCH /api/teacher/learning-paths/[id]
// DELETE /api/teacher/learning-paths/[id]
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherLearningPath } from "@/lib/db/models/TeacherLearningPath";
import { TeacherLearningPathStep } from "@/lib/db/models/TeacherLearningPathStep";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { UpdateLearningPathInput } from "@/types/teacher-content";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  await connectDB();
  const data = await TeacherLearningPath.findOne({ _id: id, created_by: uid }).lean();
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const steps = await TeacherLearningPathStep.find({ path_id: id })
    .sort({ step_order: 1 })
    .lean();

  const mappedSteps = steps.map((s) => ({
    id: s._id.toString(), path_id: s.path_id.toString(),
    step_order: s.step_order, step_type: s.step_type,
    topic_id: s.topic_id, question_set_id: s.question_set_id?.toString() ?? null,
  }));

  return NextResponse.json({
    id: data._id.toString(), created_by: data.created_by, title: data.title,
    description: data.description, is_active: data.is_active,
    created_at: data.created_at, updated_at: data.updated_at,
    steps: mappedSteps,
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

  await connectDB();
  const data = await TeacherLearningPath.findOneAndUpdate(
    { _id: id, created_by: uid }, updates, { new: true }
  ).lean();

  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: data._id.toString(), created_by: data.created_by, title: data.title,
    description: data.description, is_active: data.is_active,
    created_at: data.created_at, updated_at: data.updated_at,
  });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  await connectDB();
  await TeacherLearningPath.findOneAndUpdate(
    { _id: id, created_by: uid }, { is_active: false }
  );

  return NextResponse.json({ success: true });
}
