// GET /api/teacher/learning-paths/[id]/steps — list steps
// POST /api/teacher/learning-paths/[id]/steps — add a step
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { CreatePathStepInput } from "@/types/teacher-content";

type RouteContext = { params: Promise<{ id: string }> };

async function verifyPathOwnership(pathId: string, uid: string): Promise<NextResponse | null> {
  const { data, error } = await supabaseAdmin!
    .from("teacher_learning_paths")
    .select("id")
    .eq("id", pathId)
    .eq("created_by", uid)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return null;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id: pathId } = await context.params;

  const notFound = await verifyPathOwnership(pathId, uid);
  if (notFound) return notFound;

  const { data, error } = await supabaseAdmin!
    .from("teacher_learning_path_steps")
    .select("*")
    .eq("path_id", pathId)
    .order("step_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id: pathId } = await context.params;

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

  const { data, error } = await supabaseAdmin!
    .from("teacher_learning_path_steps")
    .insert(insertData)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
