// GET /api/teacher/topics - List all topics (default + custom)
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherTopic } from "@/lib/db/models/TeacherTopic";
import { Teacher } from "@/lib/db/models/Teacher";
import { getTeacherUid } from "@/lib/auth-helpers";
import { topicLabels } from "@/data/quizQuestions";

// GET - List default topics + teacher's custom topics
export async function GET(req: NextRequest) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;

  await connectDB();

  // Verify teacher exists in MongoDB
  const teacher = await Teacher.findOne({ auth_uid: uid, is_active: true }).lean();
  if (!teacher) {
    return NextResponse.json({ error: "Tài khoản giáo viên không tồn tại hoặc đã bị khóa" }, { status: 401 });
  }

  const customTopics = await TeacherTopic.find({ created_by: uid, is_active: true })
    .sort({ label: 1 })
    .lean();

  const defaultTopics = Object.entries(topicLabels).map(([key, label]) => ({
    topic_key: key,
    label,
    is_default: true,
  }));

  const customTopicsList = customTopics.map((t) => ({
    topic_key: t.topic_key,
    label: t.label,
    is_default: false,
    id: t._id.toString(),
  }));

  return NextResponse.json([...defaultTopics, ...customTopicsList]);
}

// POST - Create a custom topic
export async function POST(req: NextRequest) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;

  let body: { topic_key: string; label: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { topic_key, label } = body;

  if (!topic_key || !topic_key.trim()) {
    return NextResponse.json({ error: "Thiếu mã chủ đề" }, { status: 400 });
  }

  if (!label || !label.trim()) {
    return NextResponse.json({ error: "Thiếu tên chủ đề" }, { status: 400 });
  }

  if (topic_key in topicLabels) {
    return NextResponse.json({ error: "Mã chủ đề đã tồn tại trong hệ thống" }, { status: 400 });
  }

  await connectDB();

  const existing = await TeacherTopic.findOne({ created_by: uid, topic_key: topic_key.trim() }).lean();
  if (existing) {
    return NextResponse.json({ error: "Bạn đã tạo chủ đề này rồi" }, { status: 400 });
  }

  const doc = await TeacherTopic.create({
    created_by: uid,
    topic_key: topic_key.trim(),
    label: label.trim(),
  });

  return NextResponse.json({
    id: doc._id.toString(),
    created_by: doc.created_by,
    topic_key: doc.topic_key,
    label: doc.label,
    is_active: doc.is_active,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  }, { status: 201 });
}
