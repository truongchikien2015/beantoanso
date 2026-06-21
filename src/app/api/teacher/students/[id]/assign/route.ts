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

  let body: { path_id: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { path_id } = body;
  if (!path_id) return NextResponse.json({ error: "path_id required" }, { status: 400 });

  await connectDB();

  const studentObjectId = toObjectId(studentId);
  const pathObjectId = toObjectId(path_id);

  // Verify student belongs to this teacher
  const student = await TeacherStudent.findOne({
    _id: studentObjectId,
    created_by: uid,
    is_active: true,
  }).lean();

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Verify path belongs to this teacher
  const path = await TeacherLearningPath.findOne({
    _id: pathObjectId,
    created_by: uid,
    is_active: true,
  }).lean();

  if (!path) {
    return NextResponse.json({ error: "Learning path not found" }, { status: 404 });
  }

  const updated = await TeacherStudent.findOneAndUpdate(
    { _id: studentObjectId, created_by: uid },
    { assigned_path_id: pathObjectId, assigned_at: new Date() },
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
    assigned_path_id: updated.assigned_path_id?.toString() ?? null,
    assigned_at: updated.assigned_at,
    is_active: updated.is_active,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
  });
}
