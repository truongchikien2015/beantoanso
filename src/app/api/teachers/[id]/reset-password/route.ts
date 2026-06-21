import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Teacher } from "@/lib/db/models/Teacher";
import { supabaseAdmin } from "@/lib/supabase-admin";
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

// POST /api/teachers/[id]/reset-password — admin resets teacher password
export async function POST(req: NextRequest, { params }: Params) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { id } = await params;

  let body: { newPassword: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { newPassword } = body;
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  await connectDB();

  const teacherObjectId = toObjectId(id);

  // Fetch teacher
  const teacher = await Teacher.findOne({ _id: teacherObjectId } as any).lean();

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password in MongoDB
  await (Teacher as any).updateOne({ _id: teacherObjectId }, { password_hash: passwordHash });

  // Update password via Supabase Admin Auth if configured
  if (supabaseAdmin && teacher.auth_uid) {
    try {
      await supabaseAdmin.auth.admin.updateUserById(
        teacher.auth_uid,
        { password: newPassword }
      );
    } catch (updateError: any) {
      console.warn("[teachers reset-password] Supabase password reset failed:", updateError.message);
    }
  }

  return NextResponse.json({
    data: { message: `Password reset for ${teacher.name}` },
  });
}
