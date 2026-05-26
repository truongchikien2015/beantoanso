// GET /api/teacher/question-sets/[id]/questions
// POST /api/teacher/question-sets/[id]/questions
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { CreateQuestionInput } from "@/types/teacher-content";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id: setId } = await context.params;

  // Verify ownership
  const { data: set, error: setError } = await supabaseAdmin!
    .from("teacher_question_sets")
    .select("id")
    .eq("id", setId)
    .eq("created_by", uid)
    .single();

  if (setError || !set) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin!
    .from("teacher_questions")
    .select("*")
    .eq("set_id", setId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id: setId } = await context.params;

  // Verify ownership
  const { data: set, error: setError } = await supabaseAdmin!
    .from("teacher_question_sets")
    .select("id")
    .eq("id", setId)
    .eq("created_by", uid)
    .single();

  if (setError || !set) {
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

  const { data, error } = await supabaseAdmin!
    .from("teacher_questions")
    .insert({ set_id: setId, question, option_a, option_b, option_c, correct_option, explanation: explanation ?? null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
