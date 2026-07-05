import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AttendanceRecord } from "@/lib/db/models/AttendanceRecord";
import { getTeacherUid } from "@/lib/auth-helpers";

// GET - Get attendance records for a specific session
export async function GET(req: NextRequest) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;

  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: "Thiếu session_id" }, { status: 400 });
  }

  await connectDB();

  // Can populate student details if needed, but UI might already have it
  const records = await AttendanceRecord.find({ session_id: sessionId }).lean();
  return NextResponse.json(records);
}
