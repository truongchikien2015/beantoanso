// POST /api/admin/students/[id]/assign-teacher — link a self-registered student
// to a specific teacher. Pass { teacherId: string | null } (null → unassign).
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Profile } from "@/lib/db/models/Profile";
import { Teacher } from "@/lib/db/models/Teacher";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { id } = await context.params;

  let body: { teacherId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const teacherId = body.teacherId?.trim() || null;

  await connectDB();

  // If assigning (non-null), verify the teacher exists.
  if (teacherId) {
    const teacher = await Teacher.findOne({ auth_uid: teacherId } as any).lean();
    if (!teacher) {
      return NextResponse.json({ error: "Không tìm thấy giáo viên" }, { status: 404 });
    }
  }

  const result = await (Profile as any).updateOne(
    { _id: id },
    { $set: { teacher_id: teacherId } },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Không tìm thấy học sinh" }, { status: 404 });
  }

  return NextResponse.json({ success: true, teacherId });
}
