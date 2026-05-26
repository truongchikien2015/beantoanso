// GET /api/teacher/learning-paths — list all learning paths for the authenticated teacher
// POST /api/teacher/learning-paths — create a new learning path
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { CreateLearningPathInput } from "@/types/teacher-content";

export async function GET(req: NextRequest) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;

  const { data, error } = await supabaseAdmin!
    .from("teacher_learning_paths")
    .select("*, teacher_learning_path_steps(count)")
    .eq("created_by", uid)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const paths = (data ?? []).map((p) => ({
    id: p.id, created_by: p.created_by, title: p.title,
    description: p.description, is_active: p.is_active,
    created_at: p.created_at, updated_at: p.updated_at,
    step_count: Array.isArray(p.teacher_learning_path_steps)
      ? p.teacher_learning_path_steps.length : 0,
  }));

  return NextResponse.json(paths);
}

export async function POST(req: NextRequest) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;

  let body: CreateLearningPathInput;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description } = body;
  if (!title) return NextResponse.json({ error: "Missing required field: title" }, { status: 400 });

  const { data, error } = await supabaseAdmin!
    .from("teacher_learning_paths")
    .insert({ created_by: uid, title, description: description ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    id: data.id, created_by: data.created_by, title: data.title,
    description: data.description, is_active: data.is_active,
    created_at: data.created_at, updated_at: data.updated_at,
  }, { status: 201 });
}
