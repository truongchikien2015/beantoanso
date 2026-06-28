import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Teacher } from "@/lib/db/models/Teacher";
import { getTeacherUid } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authResult = getTeacherUid(req);
    if (authResult instanceof NextResponse) return authResult;
    const { uid } = authResult;

    await connectDB();

    const teacher = await Teacher.findOne({ auth_uid: uid, is_active: true }).lean();
    if (!teacher) {
      return NextResponse.json({ error: "Giáo viên không tồn tại" }, { status: 404 });
    }

    return NextResponse.json({
      name: teacher.name,
      email: teacher.email,
      school_id: teacher.school_id,
      avatar_url: teacher.avatar_url || null,
    });
  } catch (err: any) {
    console.error("GET /api/teacher/profile error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = getTeacherUid(req);
    if (authResult instanceof NextResponse) return authResult;
    const { uid } = authResult;

    let body: { name: string; email: string; school_id?: string; avatar_url?: string; password?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { name, email, school_id, avatar_url, password } = body;
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Họ tên và email là bắt buộc" }, { status: 400 });
    }

    await connectDB();

    // Check if email is already taken by another teacher
    const emailConflict = await Teacher.findOne({
      email: email.trim().toLowerCase(),
      auth_uid: { $ne: uid }
    });
    if (emailConflict) {
      return NextResponse.json({ error: "Email này đã được sử dụng bởi giáo viên khác" }, { status: 400 });
    }

    const updateData: any = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      school_id: school_id ? school_id.trim() : null,
      avatar_url: avatar_url ? avatar_url.trim() : null,
      updated_at: new Date()
    };

    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password.trim(), salt);
    }

    const updatedTeacher = await Teacher.findOneAndUpdate(
      { auth_uid: uid },
      { $set: updateData },
      { new: true }
    ).lean();

    if (!updatedTeacher) {
      return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      name: updatedTeacher.name,
      email: updatedTeacher.email,
      school_id: updatedTeacher.school_id,
      avatar_url: updatedTeacher.avatar_url,
    });
  } catch (err: any) {
    console.error("POST /api/teacher/profile error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
