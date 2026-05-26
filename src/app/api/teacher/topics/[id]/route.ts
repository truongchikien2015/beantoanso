// PATCH /api/teacher/topics/[id] - Update a custom topic
// DELETE /api/teacher/topics/[id] - Delete a custom topic
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTeacherUid } from "@/lib/auth-helpers";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH - Update a custom topic
export async function PATCH(req: NextRequest, context: RouteContext) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;
  const { id } = await context.params;

  // Verify the topic belongs to this teacher
  const { data: topic, error: fetchError } = await supabaseAdmin!
    .from("teacher_topics")
    .select("*")
    .eq("id", id)
    .eq("created_by", uid)
    .single();

  if (fetchError || !topic) {
    return NextResponse.json({ error: "Chủ đề không tìm thấy" }, { status: 404 });
  }

  let body: { label?: string; is_active?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.label !== undefined) {
    if (!body.label.trim()) {
      return NextResponse.json({ error: "Tên chủ đề không được trống" }, { status: 400 });
    }
    updates.label = body.label.trim();
  }

  if (body.is_active !== undefined) {
    updates.is_active = body.is_active;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Không có gì để cập nhật" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin!
    .from("teacher_topics")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// DELETE - Delete a custom topic
export async function DELETE(req: NextRequest, context: RouteContext) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;
  const { id } = await context.params;

  // Verify the topic belongs to this teacher
  const { data: topic, error: fetchError } = await supabaseAdmin!
    .from("teacher_topics")
    .select("id")
    .eq("id", id)
    .eq("created_by", uid)
    .single();

  if (fetchError || !topic) {
    return NextResponse.json({ error: "Chủ đề không tìm thấy" }, { status: 404 });
  }

  const { error } = await supabaseAdmin!
    .from("teacher_topics")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
