// GET /api/student/progress — get all progress for current student
// DELETE /api/student/progress — reset progress for current student
// POST /api/student/progress — sync XP for current student
// Migrated to MongoDB
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherStudentProgress } from "@/lib/db/models/TeacherStudentProgress";
import { Profile } from "@/lib/db/models/Profile";
import { getStudentId, getAnyStudentId } from "@/lib/auth-helpers";
import { ensureStudentStats, awardStudentXp } from "@/lib/server/studentRewards";
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

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = getStudentId(req);
    if (session instanceof NextResponse) return withCors(req, session);

    const { studentId } = session;
    const stats = await ensureStudentStats(studentId);

    const progress = await TeacherStudentProgress.find({ student_id: toObjectId(studentId) })
      .sort({ completed_at: -1 })
      .lean();

    const mapped = progress.map((p) => ({
      id: p._id.toString(),
      student_id: p.student_id.toString(),
      path_id: p.path_id.toString(),
      step_id: p.step_id.toString(),
      score: p.score,
      completed_at: p.completed_at,
    }));

    return jsonWithCors(req, { progress: mapped, stats });
  } catch (err: any) {
    console.error("GET /api/student/progress error:", err);
    return jsonWithCors(req, { error: "Lỗi kết nối cơ sở dữ liệu" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = getAnyStudentId(req);
    if (session instanceof NextResponse) return withCors(req, session);

    const { studentId, accountType } = session;

    let body: { xp: number; source?: string; metadata?: any };
    try {
      body = await req.json();
    } catch {
      return jsonWithCors(req, { error: "Invalid JSON" }, { status: 400 });
    }

    const { xp, source, metadata } = body;
    if (xp === undefined || xp < 0) {
      return jsonWithCors(req, { error: "Điểm số XP không hợp lệ" }, { status: 400 });
    }

    if (accountType === "self") {
      const profile = await Profile.findOne({ _id: studentId });
      if (!profile) {
        return jsonWithCors(req, { error: "Không tìm thấy hồ sơ học sinh" }, { status: 404 });
      }

      const nextXp = (profile.xp || 0) + xp;
      profile.xp = nextXp;
      profile.level = Math.floor(nextXp / 100) + 1;
      profile.total_score = (profile.total_score || 0) + xp;
      await profile.save();

      return jsonWithCors(req, {
        success: true,
        stats: {
          total_xp: profile.xp,
          level: profile.level,
          xp_in_level: profile.xp - (profile.level - 1) * 100,
          xp_for_next: 100,
          current_streak: 0,
          longest_streak: 0,
          last_daily_completed_on: null,
        },
      });
    } else {
      const stats = await awardStudentXp({
        studentId,
        source: (source as any) || "step_quiz",
        xp,
        metadata,
      });

      return jsonWithCors(req, {
        success: true,
        stats,
      });
    }
  } catch (err: any) {
    console.error("POST /api/student/progress error:", err);
    return jsonWithCors(req, { error: "Lỗi kết nối cơ sở dữ liệu" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const session = getStudentId(req);
    if (session instanceof NextResponse) return withCors(req, session);

    const { studentId } = session;

    await TeacherStudentProgress.deleteMany({ student_id: toObjectId(studentId) });

    return jsonWithCors(req, { success: true });
  } catch (err: any) {
    console.error("DELETE /api/student/progress error:", err);
    return jsonWithCors(req, { error: "Lỗi kết nối cơ sở dữ liệu" }, { status: 500 });
  }
}
