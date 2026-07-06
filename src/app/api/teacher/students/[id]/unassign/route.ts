// POST /api/teacher/students/[id]/unassign — teacher removes a self-registered
// student from their class (clears Profile.teacher_id if it matches this teacher).
// Does NOT delete the student's account — only breaks the class link.
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Profile } from "@/lib/db/models/Profile";
import { getTeacherUid } from "@/lib/auth-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;

  const { id } = await context.params;

  await connectDB();

  // Only unassign if the student is currently linked to THIS teacher —
  // prevents cross-teacher tampering.
  const result = await (Profile as any).updateOne(
    { _id: id, teacher_id: uid },
    { $set: { teacher_id: null } },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { error: "Không tìm thấy học sinh trong lớp của bạn" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
