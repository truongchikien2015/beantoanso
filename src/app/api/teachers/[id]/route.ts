import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Teacher } from "@/lib/db/models/Teacher";
<<<<<<< HEAD
import { supabaseAdmin } from "@/lib/supabase-admin";
=======
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
import mongoose from "mongoose";

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  const crypto = require("crypto");
  const hash = crypto.createHash("md5").update(id.toString()).digest("hex");
  return new mongoose.Types.ObjectId(hash.substring(0, 24));
}

type Params = { params: Promise<{ id: string }> };

// PATCH /api/teachers/[id] — update teacher (name, isActive, schoolId)
export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { id } = await params;

  let body: { name?: string; isActive?: boolean; schoolId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.isActive !== undefined) updates.is_active = body.isActive;
  if (body.schoolId !== undefined) updates.school_id = body.schoolId || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await connectDB();

  const data = await Teacher.findOneAndUpdate(
    { _id: toObjectId(id) },
    updates,
    { new: true }
  ).lean();

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: data._id.toString(),
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
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { id } = await params;

  await connectDB();

  const teacherObjectId = toObjectId(id);

<<<<<<< HEAD
  // Fetch the teacher to get auth_uid
  const teacher = await Teacher.findOne({ _id: teacherObjectId } as any).lean();

=======
  const teacher = await Teacher.findOne({ _id: teacherObjectId } as any).lean();
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
  if (!teacher) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

<<<<<<< HEAD
  // Delete from MongoDB
  await Teacher.deleteOne({ _id: teacherObjectId });

  // Delete the auth user from Supabase if configured
  if (supabaseAdmin && teacher.auth_uid) {
    try {
      await supabaseAdmin.auth.admin.deleteUser(teacher.auth_uid);
    } catch (deleteAuthError: any) {
      console.error("[teachers DELETE] Auth user deletion failed:", deleteAuthError.message);
    }
  }

=======
  await Teacher.deleteOne({ _id: teacherObjectId });

>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
  return NextResponse.json({ data: { id } });
}
