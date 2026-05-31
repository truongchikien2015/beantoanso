import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/teachers/[id] — update teacher (name, isActive, schoolId)
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { id } = await params;

  let body: { name?: string; isActive?: boolean; schoolId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.isActive !== undefined) updates.is_active = body.isActive;
  if (body.schoolId !== undefined) updates.school_id = body.schoolId;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("teachers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: data.id,
      authUid: data.auth_uid,
      name: data.name,
      email: data.email,
      schoolId: data.school_id,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  });
}

// DELETE /api/teachers/[id] — permanently delete teacher (admin only)
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { id } = await params;

  // Fetch the teacher to get auth_uid
  const { data: teacher, error: fetchError } = await supabaseAdmin
    .from("teachers")
    .select("auth_uid")
    .eq("id", id)
    .single();

  if (fetchError || !teacher) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete from teachers table first
  const { error: deleteTeacherError } = await supabaseAdmin
    .from("teachers")
    .delete()
    .eq("id", id);

  if (deleteTeacherError) {
    return NextResponse.json({ error: deleteTeacherError.message }, { status: 400 });
  }

  // Delete the auth user
  const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(teacher.auth_uid);
  if (deleteAuthError) {
    console.error("[teachers DELETE] Auth user deletion failed:", deleteAuthError.message);
  }

  return NextResponse.json({ data: { id } });
}
