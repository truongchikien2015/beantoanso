// POST /api/admin/teacher-students/[id]/reset-password — reset a teacher-created student's password (admin only)
// These students authenticate with a bcrypt-hashed password stored in teacher_students.
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
import mongoose from "mongoose";

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  const crypto = require("crypto");
  const hash = crypto.createHash("md5").update(id.toString()).digest("hex");
  return new mongoose.Types.ObjectId(hash.substring(0, 24));
}

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { id } = await context.params;

  let body: { newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const newPassword = body.newPassword?.trim();
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "Mật khẩu phải có ít nhất 6 ký tự" }, { status: 400 });
  }

  await connectDB();

  const studentObjectId = toObjectId(id);

  // Admin can reset any teacher's student.
  const student = await TeacherStudent.findOne({ _id: studentObjectId } as any).lean();

  if (!student) {
    return NextResponse.json({ error: "Không tìm thấy học sinh" }, { status: 404 });
  }

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await (TeacherStudent as any).updateOne({ _id: studentObjectId }, { password_hash: passwordHash });

  return NextResponse.json({ success: true });
}
