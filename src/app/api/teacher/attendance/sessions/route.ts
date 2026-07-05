import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AttendanceSession } from "@/lib/db/models/AttendanceSession";
import { AttendanceRecord } from "@/lib/db/models/AttendanceRecord";
import { TeacherClass } from "@/lib/db/models/TeacherClass";
import { Teacher } from "@/lib/db/models/Teacher";
import { getTeacherUid } from "@/lib/auth-helpers";

// GET - List all sessions for a teacher (optional: filter by class_name)
export async function GET(req: NextRequest) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;

  const url = new URL(req.url);
  const className = url.searchParams.get('class_name');

  await connectDB();

  const teacher = await Teacher.findOne({ auth_uid: uid, is_active: true }).lean();
  if (!teacher) {
    return NextResponse.json({ error: "Tài khoản giáo viên không tồn tại" }, { status: 401 });
  }

  const query: any = { teacher_id: uid };
  if (className) query.class_name = className;

  const sessions = await AttendanceSession.find(query).sort({ session_date: -1 }).lean();
  return NextResponse.json(sessions);
}

// POST - Create an attendance session & records
export async function POST(req: NextRequest) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;

  let body: { class_name: string; duration_hours: number; records: { student_id: string; status: 'present' | 'absent' }[] };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { class_name, duration_hours, records } = body;

  if (!class_name) return NextResponse.json({ error: "Thiếu tên lớp" }, { status: 400 });
  if (!duration_hours || duration_hours <= 0) return NextResponse.json({ error: "Thời lượng không hợp lệ" }, { status: 400 });
  if (!Array.isArray(records)) return NextResponse.json({ error: "Dữ liệu điểm danh không hợp lệ" }, { status: 400 });

  await connectDB();

  // Get hourly_rate to calculate total_cost
  const teacherClass = await TeacherClass.findOne({ created_by: uid, class_name }).lean();
  const rate = teacherClass?.hourly_rate || 0;
  const totalCost = rate * duration_hours;

  const session = await AttendanceSession.create({
    teacher_id: uid,
    class_name,
    duration_hours,
    total_cost: totalCost,
    session_date: new Date()
  });

  const recordDocs = records.map(r => ({
    session_id: session._id,
    student_id: r.student_id,
    status: r.status
  }));

  if (recordDocs.length > 0) {
    await AttendanceRecord.insertMany(recordDocs);
  }

  return NextResponse.json({ session, count: recordDocs.length }, { status: 201 });
}
