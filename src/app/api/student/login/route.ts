// POST /api/student/login — Student login with code + password
// GET /api/student/login — Get current student info (unified teacher-created & self-registered)
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
import { Profile } from "@/lib/db/models/Profile";
import { TeacherLearningPath } from "@/lib/db/models/TeacherLearningPath";
import { TeacherLearningPathStep } from "@/lib/db/models/TeacherLearningPathStep";
import type { StudentLoginInput } from "@/types/teacher-content";
import { createStudentToken, getAnyStudentId } from "@/lib/auth-helpers";
import { ensureStudentStats } from "@/lib/server/studentRewards";
import { corsOptions, jsonWithCors, withCors } from "@/lib/cors";
import mongoose from "mongoose";

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  const crypto = require("crypto");
  const hash = crypto.createHash("md5").update(id.toString()).digest("hex");
  return new mongoose.Types.ObjectId(hash.substring(0, 24));
}

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// POST /api/student/login
export async function POST(req: NextRequest) {
  await connectDB();

  let body: StudentLoginInput;
  try {
    body = await req.json();
  } catch {
    return jsonWithCors(req, { error: "Invalid JSON" }, { status: 400 });
  }

  const { student_code, password } = body;
  console.log(`🔑 [API Student Login] student_code: "${student_code}", password: "${password}", password.length: ${password?.length}`);
  const loginId = student_code?.trim();
  if (!loginId || !password) {
    return jsonWithCors(req, { error: "Missing student_code or password" }, { status: 400 });
  }

  let student = await TeacherStudent.findOne({
    student_code: loginId,
    is_active: true,
  }).lean();

  if (!student && loginId.includes("@")) {
    student = await TeacherStudent.findOne({
      email: loginId.toLowerCase(),
      is_active: true,
    }).lean();
  }

  if (!student) {
    return jsonWithCors(req, { error: "Mã học sinh/email hoặc mật khẩu không đúng" }, { status: 401 });
  }

  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(password, student.password_hash);
  if (!valid) {
    return jsonWithCors(req, { error: "Mã học sinh/email hoặc mật khẩu không đúng" }, { status: 401 });
  }

  const token = createStudentToken(student._id.toString());

  return jsonWithCors(req, {
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

  const session = getAnyStudentId(req);
  if (session instanceof NextResponse) return withCors(req, session);

  const { studentId, accountType } = session;

  if (accountType === "self") {
    const profile = await Profile.findOne({ _id: studentId }).lean();
    if (!profile) return jsonWithCors(req, { error: "Không tìm thấy hồ sơ" }, { status: 404 });

    const studentData = {
      id: profile._id.toString(),
      nickname: profile.full_name || profile.email?.split("@")[0] || "Học sinh",
      email: profile.email,
      class_name: "Tự do",
      student_code: null,
      assigned_path_id: null,
      assigned_at: null,
      xp: profile.xp || 0,
      level: profile.level || 1,
    };

    return jsonWithCors(req, { student: studentData, assigned_path: null });
  }

  const student = await TeacherStudent.findOne({
    _id: toObjectId(studentId),
    is_active: true,
  }).lean();

  if (!student) return jsonWithCors(req, { error: "Không tìm thấy học sinh" }, { status: 404 });

  const stats = await ensureStudentStats(student._id.toString());

  const studentData = {
    id: student._id.toString(),
    nickname: student.nickname,
    email: student.email,
    class_name: student.class_name,
    student_code: student.student_code,
    assigned_path_id: student.assigned_path_id?.toString() ?? null,
    assigned_at: student.assigned_at,
    xp: stats.total_xp,
    level: stats.level,
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

  return jsonWithCors(req, { student: studentData, assigned_path });
}
