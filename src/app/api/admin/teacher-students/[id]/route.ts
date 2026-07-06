// DELETE /api/admin/teacher-students/[id] — permanently delete a teacher-created student (admin only).
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
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

export async function DELETE(req: NextRequest, context: RouteContext) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { id } = await context.params;

  await connectDB();

  const result = await TeacherStudent.deleteOne({ _id: toObjectId(id) } as any);

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Không tìm thấy học sinh" }, { status: 404 });
  }

  return NextResponse.json({ success: true, deleted: 1 });
}
