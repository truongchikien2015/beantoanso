// DELETE /api/teacher/students/[id] — soft-delete a student
// GET /api/teacher/students/[id] — get a single student
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

export async function GET(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  await connectDB();

  const student = await TeacherStudent.findOne({
    _id: toObjectId(id),
    created_by: uid,
  }).lean();

  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: student._id.toString(),
    created_by: student.created_by,
    nickname: student.nickname,
    email: student.email,
    class_name: student.class_name,
    student_code: student.student_code,
    parent_access_code: student.parent_access_code ?? null,
    assigned_path_ids: (student.assigned_path_ids || []).map(id => id.toString()),
    assigned_at: student.assigned_at,
    is_active: student.is_active,
    created_at: student.created_at,
    updated_at: student.updated_at,
  });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  await connectDB();

  const student = await TeacherStudent.findOneAndUpdate(
    { _id: toObjectId(id), created_by: uid },
    { is_active: false },
    { new: true }
  ).lean();

  if (!student) return NextResponse.json({ error: "Student not found or unauthorized" }, { status: 404 });

  return NextResponse.json({ success: true });
}
