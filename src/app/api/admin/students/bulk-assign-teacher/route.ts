// POST /api/admin/students/bulk-assign-teacher — assign multiple self-registered
// students to a single teacher (or unassign if teacherId is null).
// Body: { ids: string[], teacherId: string | null }
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Profile } from "@/lib/db/models/Profile";
import { Teacher } from "@/lib/db/models/Teacher";

export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  let body: { ids?: unknown; teacherId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "Danh sách rỗng" }, { status: 400 });
  }

  const teacherId =
    typeof body.teacherId === "string" && body.teacherId.trim().length > 0
      ? body.teacherId.trim()
      : null;

  await connectDB();

  if (teacherId) {
    const teacher = await Teacher.findOne({ auth_uid: teacherId } as any).lean();
    if (!teacher) {
      return NextResponse.json({ error: "Không tìm thấy giáo viên" }, { status: 404 });
    }
  }

  const result = await Profile.updateMany(
    { _id: { $in: ids } } as any,
    { $set: { teacher_id: teacherId } },
  );

  return NextResponse.json({
    success: true,
    matched: result.matchedCount ?? 0,
    modified: result.modifiedCount ?? 0,
    teacherId,
  });
}
