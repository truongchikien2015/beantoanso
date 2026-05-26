// GET /api/teacher/question-sets — list all question sets for the authenticated teacher
// POST /api/teacher/question-sets — create a new question set
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { CreateQuestionSetInput } from "@/types/teacher-content";

// GET /api/teacher/question-sets
export async function GET(req: NextRequest) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;

  const { data, error } = await supabaseAdmin!
    .from("teacher_question_sets")
    .select("*, teacher_questions(count)")
    .eq("created_by", uid)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sets = (data ?? []).map((s) => ({
    id: s.id,
    created_by: s.created_by,
    title: s.title,
    topic_id: s.topic_id,
    description: s.description,
    is_active: s.is_active,
    created_at: s.created_at,
    updated_at: s.updated_at,
    question_count: Array.isArray(s.teacher_questions) ? s.teacher_questions.length : 0,
  }));

  return NextResponse.json(sets);
}

// POST /api/teacher/question-sets
export async function POST(req: NextRequest) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;

  let body: CreateQuestionSetInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, topic_id, description } = body;
  if (!title || !topic_id) {
    return NextResponse.json({ error: "Missing required fields: title, topic_id" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin!
    .from("teacher_question_sets")
    .insert({ created_by: uid, title, topic_id, description: description ?? null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    id: data.id,
    created_by: data.created_by,
    title: data.title,
    topic_id: data.topic_id,
    description: data.description,
    is_active: data.is_active,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }, { status: 201 });
}
