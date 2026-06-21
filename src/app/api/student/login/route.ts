// POST /api/student/login — Student login with code + password
// GET /api/student/login — Get current student info
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
import { TeacherLearningPath } from "@/lib/db/models/TeacherLearningPath";
import { TeacherLearningPathStep } from "@/lib/db/models/TeacherLearningPathStep";
import type { StudentLoginInput } from "@/types/teacher-content";
import { createStudentToken, verifyStudentToken } from "@/lib/auth-helpers";
import mongoose from "mongoose";

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  const crypto = require("crypto");
  const hash = crypto.createHash("md5").update(id.toString()).digest("hex");
  return new mongoose.Types.ObjectId(hash.substring(0, 24));
}

// POST /api/student/login
export async function POST(req: NextRequest) {
  await connectDB();

  let body: StudentLoginInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { student_code, password } = body;
  const loginId = student_code?.trim();
  if (!loginId || !password) {
    return NextResponse.json({ error: "Missing student_code or password" }, { status: 400 });
  }

  let student = await TeacherStudent.findOne({
    student_code: loginId,
    is_active: true,
  }).lean();

  console.log("[DEBUG LOGIN] student_code query:", loginId);
  console.log("[DEBUG LOGIN] found student:", student ? { id: student._id, nickname: student.nickname, student_code: student.student_code, password_hash: student.password_hash } : "null");

  if (!student && loginId.includes("@")) {
    student = await TeacherStudent.findOne({
      email: loginId.toLowerCase(),
      is_active: true,
    }).lean();
    console.log("[DEBUG LOGIN] email query found student:", student ? { id: student._id, nickname: student.nickname, student_code: student.student_code } : "null");
  }

  if (!student) {
    console.log("[DEBUG LOGIN] No student found, returning 401");
    return NextResponse.json({ error: "Mã học sinh/email hoặc mật khẩu không đúng" }, { status: 401 });
  }

  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(password, student.password_hash);
  console.log("[DEBUG LOGIN] bcrypt comparison result:", valid);
  if (!valid) {
    return NextResponse.json({ error: "Mã học sinh/email hoặc mật khẩu không đúng" }, { status: 401 });
  }

  const token = createStudentToken(student._id.toString());

  return NextResponse.json({
    token,
    student: {
      id: student._id.toString(),
      nickname: student.nickname,
      email: student.email,
      class_name: student.class_name,
      student_code: student.student_code,
      assigned_path_id: student.assigned_path_id?.toString() ?? null,
    },
  });
}

// GET /api/student/login
export async function GET(req: NextRequest) {
  await connectDB();

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = auth.slice(7);
  const session = verifyStudentToken(token);
  if (!session) {
    return NextResponse.json({ error: "Token không hợp lệ hoặc đã hết hạn" }, { status: 401 });
  }

  const student = await TeacherStudent.findOne({
    _id: toObjectId(session.studentId),
    is_active: true,
  }).lean();

  if (!student) return NextResponse.json({ error: "Không tìm thấy học sinh" }, { status: 404 });

  const studentData = {
    id: student._id.toString(),
    nickname: student.nickname,
    email: student.email,
    class_name: student.class_name,
    student_code: student.student_code,
    assigned_path_id: student.assigned_path_id?.toString() ?? null,
    assigned_at: student.assigned_at,
  };

  let assigned_path = null;
  if (student.assigned_path_id) {
    const path = await TeacherLearningPath.findOne({
      _id: student.assigned_path_id,
      is_active: true,
    }).lean();

    if (path) {
      const steps = await TeacherLearningPathStep.find({
        path_id: path._id,
      })
        .sort({ step_order: 1 })
        .lean();

      assigned_path = {
        id: path._id.toString(),
        title: path.title,
        description: path.description,
        steps: steps.map((s) => ({
          id: s._id.toString(),
          step_order: s.step_order,
          step_type: s.step_type,
          topic_id: s.topic_id,
          question_set_id: s.question_set_id?.toString() ?? null,
        })),
      };
    }
  }

  return NextResponse.json({ student: studentData, assigned_path });
}
