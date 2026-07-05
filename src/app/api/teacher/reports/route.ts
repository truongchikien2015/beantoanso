import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
import { Result } from "@/lib/db/models/Result";
import { StudentAnswer } from "@/lib/db/models/StudentAnswer";
import { getTeacherUid } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authResult = getTeacherUid(req);
    if (authResult instanceof NextResponse) return authResult;
    const { uid } = authResult;

    await connectDB();

    // 1. Fetch all active students created by this teacher
    const students = await TeacherStudent.find({ created_by: uid, is_active: true }).lean();
    if (!students || students.length === 0) {
      return NextResponse.json({ results: [], answers: [] });
    }

    const studentIds = students.map((s) => s._id.toString());
    const studentCodes = students.map((s) => s.student_code);

    // 2. Fetch results matching studentIds or studentCodes
    const dbResults = await Result.find({
      $or: [
        { player_id: { $in: studentIds } },
        { player_id: { $in: studentCodes } }
      ]
    }).sort({ completed_at: -1 }).lean();

    // 3. Fetch answers matching studentIds or studentCodes
    const dbAnswers = await StudentAnswer.find({
      $or: [
        { player_id: { $in: studentIds } },
        { player_id: { $in: studentCodes } }
      ]
    }).sort({ timestamp: -1 }).lean();

    // 4. Map DB models to frontend format
    const results = dbResults.map((r: any) => ({
      id: r._id.toString(),
      player_id: r.player_id,
      nickname: r.nickname,
      mission_score: r.mission_score,
      quiz_score: r.quiz_score,
      total_score: r.total_score,
      title: r.title,
      badge: r.badge,
      completed_at: r.completed_at?.toISOString() || new Date().toISOString(),
      class_name: students.find(s => s._id.toString() === r.player_id || s.student_code === r.player_id)?.class_name || null
    }));

    const answers = dbAnswers.map((a: any) => ({
      id: a._id.toString(),
      playerId: a.player_id,
      nickname: a.nickname,
      topicId: a.topic_slug,
      topicLabel: a.topic_label,
      selectedOption: a.selected_option,
      correctOption: a.correct_option,
      isCorrect: a.is_correct,
      timestamp: a.timestamp?.toISOString() || new Date().toISOString(),
      class_name: students.find(s => s._id.toString() === a.player_id || s.student_code === a.player_id)?.class_name || null
    }));

    return NextResponse.json({ results, answers });
  } catch (err: any) {
    console.error("GET /api/teacher/reports error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
