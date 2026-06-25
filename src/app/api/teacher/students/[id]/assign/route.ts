// POST /api/teacher/students/[id]/assign — assign a learning path to a student
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
import { TeacherLearningPath } from "@/lib/db/models/TeacherLearningPath";
import { getTeacherUid } from "@/lib/auth-helpers";
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
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id: studentId } = await context.params;

  let body: { path_ids: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { path_ids } = body;
  if (!Array.isArray(path_ids)) return NextResponse.json({ error: "path_ids array required" }, { status: 400 });

  await connectDB();

  const studentObjectId = toObjectId(studentId);
  const pathObjectIds = path_ids.map(toObjectId);

  // Verify student belongs to this teacher
  const student = await TeacherStudent.findOne({
    _id: studentObjectId,
    created_by: uid,
    is_active: true,
  }).lean();

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Verify paths belong to this teacher
  const paths = await TeacherLearningPath.find({
    _id: { $in: pathObjectIds },
    created_by: uid,
    is_active: true,
  }).lean();

  if (paths.length !== pathObjectIds.length) {
    return NextResponse.json({ error: "One or more learning paths not found" }, { status: 404 });
  }

  const updated = await TeacherStudent.findOneAndUpdate(
    { _id: studentObjectId, created_by: uid },
    { assigned_path_ids: pathObjectIds, assigned_at: new Date() },
    { new: true }
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
  }

  return NextResponse.json({
    id: updated._id.toString(),
    created_by: updated.created_by,
    nickname: updated.nickname,
    email: updated.email,
    class_name: updated.class_name,
    student_code: updated.student_code,
    parent_access_code: updated.parent_access_code ?? null,
    assigned_path_ids: (updated.assigned_path_ids || []).map(id => id.toString()),
    assigned_at: updated.assigned_at,
    is_active: updated.is_active,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
  });
}
