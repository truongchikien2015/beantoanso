import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherClass } from "@/lib/db/models/TeacherClass";
import { Teacher } from "@/lib/db/models/Teacher";
import { getTeacherUid } from "@/lib/auth-helpers";

// GET - List all classes with their hourly rate for a teacher
export async function GET(req: NextRequest) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;

  await connectDB();

  const teacher = await Teacher.findOne({ auth_uid: uid, is_active: true }).lean();
  if (!teacher) {
    return NextResponse.json({ error: "Tài khoản giáo viên không tồn tại hoặc đã bị khóa" }, { status: 401 });
  }

  const classes = await TeacherClass.find({ created_by: uid }).sort({ class_name: 1 }).lean();
  return NextResponse.json(classes);
}

// POST - Upsert hourly rate for a class
export async function POST(req: NextRequest) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;

  let body: { class_name: string; hourly_rate: number };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { class_name, hourly_rate } = body;

  if (!class_name || !class_name.trim()) {
    return NextResponse.json({ error: "Thiếu tên lớp" }, { status: 400 });
  }

  if (typeof hourly_rate !== 'number' || hourly_rate < 0) {
    return NextResponse.json({ error: "Chi phí giờ học không hợp lệ" }, { status: 400 });
  }

  await connectDB();

  const doc = await TeacherClass.findOneAndUpdate(
    { created_by: uid, class_name: class_name.trim() },
    { hourly_rate },
    { new: true, upsert: true }
  );

  return NextResponse.json(doc, { status: 200 });
}
