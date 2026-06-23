import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import * as Models from "@/lib/db/models";

const modelsMap: Record<string, any> = {
  profiles: Models.Profile,
  teachers: Models.Teacher,
  teacher_students: Models.TeacherStudent,
  teacher_question_sets: Models.TeacherQuestionSet,
  teacher_questions: Models.TeacherQuestion,
  teacher_learning_paths: Models.TeacherLearningPath,
  teacher_learning_path_steps: Models.TeacherLearningPathStep,
  teacher_student_progress: Models.TeacherStudentProgress,
  teacher_student_stats: Models.TeacherStudentStats,
  teacher_xp_events: Models.TeacherXpEvent,
  teacher_topics: Models.TeacherTopic,
  questions: Models.Question,
  results: Models.Result,
  topics: Models.Topic,
  learning_paths: Models.LearningPath,
  student_answers: Models.StudentAnswer,
  user_progress: Models.UserProgress,
  daily_quiz_answers: Models.DailyQuizAnswer,
  teacher_student_daily_attempts: Models.TeacherStudentDailyAttempt,
};

// GET /api/admin/backup-restore — Export all MongoDB collections
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const dbData: Record<string, any[]> = {};

  try {
    await connectDB();
    for (const [key, Model] of Object.entries(modelsMap)) {
      const data = await Model.find({}).lean();
      dbData[key] = data || [];
    }

    return NextResponse.json({ data: dbData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/backup-restore — Import/Restore MongoDB collections
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  let body: { data?: Record<string, any[]> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const importData = body.data;
  if (!importData || typeof importData !== "object") {
    return NextResponse.json({ error: "Missing database 'data' object" }, { status: 400 });
  }

  const results: Record<string, { count: number; status: string; error?: string }> = {};

  try {
    await connectDB();
    for (const [key, Model] of Object.entries(modelsMap)) {
      const rows = importData[key];
      if (!Array.isArray(rows) || rows.length === 0) {
        results[key] = { count: 0, status: "skipped" };
        continue;
      }

      let successCount = 0;
      let failError = null;

      for (const row of rows) {
        try {
          if (!row._id) {
            continue;
          }
          await Model.replaceOne({ _id: row._id }, row, { upsert: true });
          successCount++;
        } catch (e: any) {
          failError = e.message;
        }
      }

      if (failError && successCount === 0) {
        results[key] = { count: rows.length, status: "failed", error: failError };
      } else if (failError) {
        results[key] = { count: rows.length, status: "partial_success", error: failError };
      } else {
        results[key] = { count: rows.length, status: "success" };
      }
    }

    return NextResponse.json({
      message: "Restore operation completed",
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
