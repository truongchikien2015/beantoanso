// PATCH /api/teacher/topics/[id] - Update a custom topic
// DELETE /api/teacher/topics/[id] - Delete a custom topic
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherTopic } from "@/lib/db/models/TeacherTopic";
import { getTeacherUid } from "@/lib/auth-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;
  const { id } = await context.params;

  await connectDB();

  const topic = await TeacherTopic.findOne({ _id: id, created_by: uid }).lean();
  if (!topic) return NextResponse.json({ error: "Chủ đề không tìm thấy" }, { status: 404 });

  let body: { label?: string; is_active?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.label !== undefined) {
    if (!body.label.trim()) return NextResponse.json({ error: "Tên chủ đề không được trống" }, { status: 400 });
    updates.label = body.label.trim();
  }
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Không có gì để cập nhật" }, { status: 400 });
  }

  const data = await TeacherTopic.findOneAndUpdate(
    { _id: id, created_by: uid }, updates, { new: true }
  ).lean();

  return NextResponse.json({
    id: data!._id.toString(),
    topic_key: data!.topic_key,
    label: data!.label,
    is_active: data!.is_active,
  });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;
  const { id } = await context.params;

  await connectDB();

  const topic = await TeacherTopic.findOne({ _id: id, created_by: uid }).lean();
  if (!topic) return NextResponse.json({ error: "Chủ đề không tìm thấy" }, { status: 404 });

  await TeacherTopic.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
