import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
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

function generateParentAccessCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "PH-";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function getUniqueParentAccessCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const code = generateParentAccessCode();
    const existing = await TeacherStudent.findOne({ parent_access_code: code }).lean();
    if (!existing) return code;
    attempts++;
  }
  throw new Error("Không thể tạo mã liên kết phụ huynh duy nhất.");
}

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;
  const { id } = await context.params;

  let body: { action?: "ensure" | "regenerate" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action } = body;
  if (action !== "ensure" && action !== "regenerate") {
    return NextResponse.json({ error: "Tham số action phải là 'ensure' hoặc 'regenerate'" }, { status: 400 });
  }

  await connectDB();

  const student = await TeacherStudent.findOne({
    _id: toObjectId(id),
    created_by: uid,
  });

  if (!student) {
    return NextResponse.json({ error: "Không tìm thấy học sinh hoặc bạn không có quyền" }, { status: 404 });
  }

  if (action === "ensure" && student.parent_access_code) {
    return NextResponse.json({
      parent_access_code: student.parent_access_code,
      parent_url: `/parent?code=${student.parent_access_code}`,
    });
  }

  try {
    const newCode = await getUniqueParentAccessCode();
    student.parent_access_code = newCode;
    await student.save();

    return NextResponse.json({
      parent_access_code: newCode,
      parent_url: `/parent?code=${newCode}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Lỗi tạo mã phụ huynh" }, { status: 500 });
  }
}
