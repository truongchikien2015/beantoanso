// POST /api/student/certificate — Issue or fetch certificate for a student
// Creates a Result document in MongoDB so the share/verify page can display real scores
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
import { TeacherLearningPathStep } from "@/lib/db/models/TeacherLearningPathStep";
import { TeacherStudentProgress } from "@/lib/db/models/TeacherStudentProgress";
import { Result } from "@/lib/db/models/Result";
import { getAnyStudentId } from "@/lib/auth-helpers";
import { Profile } from "@/lib/db/models/Profile";
import { getBadge } from "@/data/gameData";

export async function POST(req: NextRequest) {
  await connectDB();

  const session = getAnyStudentId(req);
  if (session instanceof NextResponse) return session;

  const { studentId, accountType } = session;

  // Determine nickname
  let nickname = "Bạn nhỏ";
  let assignedPathId: string | null = null;

  if (accountType === "self") {
    const profile = await Profile.findOne({ _id: studentId } as any).lean();
    nickname = (profile as any)?.full_name ?? "Bạn nhỏ";
    // Self-registered students don't have assigned paths
  } else {
    const student = await TeacherStudent.findOne({ _id: studentId, is_active: true })
      .select("nickname assigned_path_id")
      .lean();

    if (!student) {
      return NextResponse.json({ error: "Không tìm thấy học sinh" }, { status: 404 });
    }
    nickname = student.nickname;
    assignedPathId = student.assigned_path_id?.toString() ?? null;
  }

  if (!assignedPathId) {
    return NextResponse.json({ error: "Chưa có lộ trình được gán" }, { status: 400 });
  }

  // Get all steps of the path
  const steps = await TeacherLearningPathStep.find({ path_id: assignedPathId })
    .select("_id step_type")
    .lean();

  if (steps.length === 0) {
    return NextResponse.json({ error: "Lộ trình không có bước nào" }, { status: 400 });
  }

  const stepIds = steps.map((s) => s._id.toString());

  // Get student progress for all steps in the path
  const progress = await TeacherStudentProgress.find({
    student_id: studentId,
    step_id: { $in: stepIds },
  })
    .select("step_id score completed_at")
    .lean();

  const progressMap = new Map(
    progress.map((p) => [p.step_id.toString(), p])
  );

  // Check if all steps are completed
  const allCompleted = stepIds.every((id) => progressMap.has(id));
  if (!allCompleted) {
    return NextResponse.json(
      {
        error: "Chưa hoàn thành tất cả các bước",
        completed: progress.length,
        total: steps.length,
      },
      { status: 400 }
    );
  }

  // Calculate scores
  const topicSteps = steps.filter((s) => s.step_type === "topic");
  const quizSteps = steps.filter((s) => s.step_type === "question_set");

  const topicScores = topicSteps.map(
    (s) => progressMap.get(s._id.toString())?.score ?? 0
  );
  const quizScores = quizSteps.map(
    (s) => progressMap.get(s._id.toString())?.score ?? 0
  );

  const missionScore =
    topicScores.length > 0
      ? Math.round(topicScores.reduce((a, b) => a + b, 0) / topicScores.length)
      : 0;

  const quizScore =
    quizScores.length > 0
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : 0;

  const totalScore = Math.round(
    progress.reduce((s, p) => s + p.score, 0) / progress.length
  );

  const badge = getBadge(totalScore);

  // Last completed date
  const lastCompleted = progress.reduce(
    (latest, p) =>
      p.completed_at && new Date(p.completed_at) > latest
        ? new Date(p.completed_at)
        : latest,
    new Date(0)
  );

  // Upsert a Result document for this student
  const result = await Result.findOneAndUpdate(
    { player_id: studentId },
    {
      $set: {
        nickname,
        mission_score: missionScore,
        quiz_score: quizScore,
        total_score: totalScore,
        title: badge.title,
        badge: badge.emoji,
        completed_at: lastCompleted.getTime() > 0 ? lastCompleted : new Date(),
      },
    },
    { upsert: true, new: true, lean: true }
  );

  return NextResponse.json({
    result_id: result._id.toString(),
    nickname,
    mission_score: missionScore,
    quiz_score: quizScore,
    total_score: totalScore,
    title: badge.title,
    badge: badge.emoji,
  });
}
