// GET /api/teacher/topics - List all topics (default + custom)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTeacherUid } from "@/lib/auth-helpers";
import { topicLabels, QuizTopic } from "@/data/quizQuestions";

// GET - List default topics + teacher's custom topics
export async function GET(req: NextRequest) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;

  // Get teacher's custom topics
  const { data: customTopics, error: customError } = await supabaseAdmin!
    .from("teacher_topics")
    .select("*")
    .eq("created_by", uid)
    .eq("is_active", true)
    .order("label");

  if (customError) {
    return NextResponse.json({ error: customError.message }, { status: 500 });
  }

  // Combine default topics with custom topics
  const defaultTopics = Object.entries(topicLabels).map(([key, label]) => ({
    topic_key: key,
    label,
    is_default: true,
  }));

  const customTopicsList = (customTopics ?? []).map((t) => ({
    topic_key: t.topic_key,
    label: t.label,
    is_default: false,
    id: t.id,
  }));

  const allTopics = [...defaultTopics, ...customTopicsList];

  return NextResponse.json(allTopics);
}

// POST - Create a custom topic
export async function POST(req: NextRequest) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;

  let body: { topic_key: string; label: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { topic_key, label } = body;

  if (!topic_key || !topic_key.trim()) {
    return NextResponse.json({ error: "Thiếu mã chủ đề" }, { status: 400 });
  }

  if (!label || !label.trim()) {
    return NextResponse.json({ error: "Thiếu tên chủ đề" }, { status: 400 });
  }

  // Check if topic_key already exists in default topics
  if (topic_key in topicLabels) {
    return NextResponse.json({ error: "Mã chủ đề đã tồn tại trong hệ thống" }, { status: 400 });
  }

  // Check if teacher already has this topic_key
  const { data: existing } = await supabaseAdmin!
    .from("teacher_topics")
    .select("id")
    .eq("created_by", uid)
    .eq("topic_key", topic_key.trim())
    .single();

  if (existing) {
    return NextResponse.json({ error: "Bạn đã tạo chủ đề này rồi" }, { status: 400 });
  }

  // Create the topic
  const { data, error } = await supabaseAdmin!
    .from("teacher_topics")
    .insert({
      created_by: uid,
      topic_key: topic_key.trim(),
      label: label.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
