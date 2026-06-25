// POST /api/teacher/learning-paths/[id]/assign-students
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherLearningPath } from "@/lib/db/models/TeacherLearningPath";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
import { getTeacherUid } from "@/lib/auth-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;
  const { id: pathId } = await context.params;

  let body: { studentIds: string[] };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { studentIds } = body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return NextResponse.json({ error: "studentIds must be a non-empty array" }, { status: 400 });
  }

  await connectDB();

  const path = await TeacherLearningPath.findOne({ _id: pathId, created_by: uid })
    .select("_id title")
    .lean();

  if (!path) {
    return NextResponse.json({ error: "Learning path not found" }, { status: 404 });
  }

  // Verify all students belong to this teacher
  const students = await TeacherStudent.find({ _id: { $in: studentIds }, created_by: uid })
    .select("_id")
    .lean();

  const validStudentIds = students.map((s) => s._id.toString());
  const now = new Date();

  // Batch update
  await TeacherStudent.updateMany(
    { _id: { $in: validStudentIds } },
    { $addToSet: { assigned_path_ids: pathId }, $set: { assigned_at: now } }
  );

  const updated = await TeacherStudent.find({ _id: { $in: validStudentIds } })
    .select("-password_hash")
    .lean();

  return NextResponse.json({
    success: true,
    pathId,
    pathTitle: path.title,
    assignedCount: validStudentIds.length,
    students: updated.map((s) => ({ ...s, id: s._id.toString() })),
  });
}
