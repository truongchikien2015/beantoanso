// GET /api/teacher/question-sets/[id]
// PATCH /api/teacher/question-sets/[id]
// DELETE /api/teacher/question-sets/[id]
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherQuestionSet } from "@/lib/db/models/TeacherQuestionSet";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { UpdateQuestionSetInput } from "@/types/teacher-content";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  await connectDB();
  const data = await TeacherQuestionSet.findOne({ _id: id, created_by: uid }).lean();

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: data._id.toString(), created_by: data.created_by, title: data.title,
    topic_id: data.topic_id, description: data.description,
    is_active: data.is_active, created_at: data.created_at, updated_at: data.updated_at,
  });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  let body: UpdateQuestionSetInput;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, topic_id, description, is_active } = body;
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (topic_id !== undefined) updates.topic_id = topic_id;
  if (description !== undefined) updates.description = description;
  if (is_active !== undefined) updates.is_active = is_active;

  await connectDB();
  const data = await TeacherQuestionSet.findOneAndUpdate(
    { _id: id, created_by: uid },
    updates,
    { new: true }
  ).lean();

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: data._id.toString(), created_by: data.created_by, title: data.title,
    topic_id: data.topic_id, description: data.description,
    is_active: data.is_active, created_at: data.created_at, updated_at: data.updated_at,
  });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  await connectDB();
  // Soft-delete: mark as inactive
  await TeacherQuestionSet.findOneAndUpdate(
    { _id: id, created_by: uid },
    { is_active: false }
  );

  return NextResponse.json({ success: true });
}
