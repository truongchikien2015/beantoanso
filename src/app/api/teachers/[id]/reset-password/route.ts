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

<<<<<<< HEAD
// POST /api/teachers/[id]/reset-password — admin resets teacher password
=======
// POST /api/teachers/[id]/reset-password — admin resets teacher password.
// Verifies write with a read-back so a silent 0-modified doesn't look like success.
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
export async function POST(req: NextRequest, { params }: Params) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { id } = await params;

<<<<<<< HEAD
  let body: { newPassword: string };
=======
  let body: { newPassword?: string };
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

<<<<<<< HEAD
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
=======
  const newPassword = body.newPassword?.trim();
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "Mật khẩu phải có ít nhất 6 ký tự" }, { status: 400 });
  }

  try {
    await connectDB();

    const teacherObjectId = toObjectId(id);
    const teacher = await Teacher.findOne({ _id: teacherObjectId } as any).lean();

    if (!teacher) {
      console.warn(`[teachers/reset-password] not found id=${id}`);
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const updateResult = await (Teacher as any).updateOne(
      { _id: teacherObjectId },
      { $set: { password_hash: passwordHash } },
    );

    console.log(
      `[teachers/reset-password] id=${id} email=${teacher.email} matched=${updateResult.matchedCount} modified=${updateResult.modifiedCount}`,
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Không cập nhật được mật khẩu (không khớp hồ sơ)" },
        { status: 500 },
      );
    }

    // Read-back verification — proves the hash actually persisted.
    const after = await Teacher.findOne({ _id: teacherObjectId } as any).select("password_hash").lean();
    const verified = !!after?.password_hash && (await bcrypt.compare(newPassword, after.password_hash));
    if (!verified) {
      console.error(`[teachers/reset-password] verify FAILED for id=${id}`);
      return NextResponse.json(
        { error: "Đặt lại mật khẩu không xác minh được (bcrypt compare fail sau write)" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: { message: `Password reset for ${teacher.name}` },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[teachers/reset-password] failed:", message);
    return NextResponse.json(
      { error: `Lỗi đặt lại mật khẩu: ${message}` },
      { status: 500 },
    );
  }
>>>>>>> 63771e6d805e9ba0b1418fb71692bcfb593b2331
}
