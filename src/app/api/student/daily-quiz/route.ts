import { NextRequest, NextResponse } from "next/server";
import { getAnyStudentId } from "@/lib/auth-helpers";
import { connectDB } from "@/lib/mongodb";
import { TeacherStudentDailyAttempt } from "@/lib/db/models/TeacherStudentDailyAttempt";
import { TeacherQuestion } from "@/lib/db/models/TeacherQuestion";
import {
  DAILY_QUESTION_COUNT,
  XP_PER_CORRECT_ANSWER,
  awardStudentXp,
  completeDailyStreak,
  ensureStudentStats,
  todayKey,
} from "@/lib/server/studentRewards";
import type {
  StudentDailyQuizAnswer,
  StudentDailyQuizResponse,
  StudentDailyQuizResult,
} from "@/types/teacher-content";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type QuestionRow = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "A" | "B" | "C";
  explanation: string | null;
};

type AttemptRow = {
  question_ids: string[];
  answers: Array<{ question_id: string; selected_option: "A" | "B" | "C"; is_correct: boolean }>;
  correct_count: number;
  xp_awarded: number;
  completed_at: string;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function publicQuestions(questions: QuestionRow[]): StudentDailyQuizResponse["questions"] {
  return questions.map((q) => ({
    id: q.id,
    question: q.question,
    options: [q.option_a, q.option_b, q.option_c],
  }));
}

function buildAttemptResult(questions: QuestionRow[], attempt: AttemptRow): StudentDailyQuizResponse["result"] {
  const selectedMap = new Map(
    (attempt.answers ?? []).map((answer) => [answer.question_id, answer.selected_option]),
  );

  const answers: StudentDailyQuizResult[] = questions.map((q) => {
    const selected = selectedMap.get(q.id) ?? null;
    return {
      question_id: q.id,
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      selected_option: selected,
      correct_option: q.correct_option,
      is_correct: selected === q.correct_option,
      explanation: q.explanation,
    };
  });

  return {
    correct_count: attempt.correct_count,
    total: questions.length,
    xp_awarded: attempt.xp_awarded,
    answers,
    completed_at: attempt.completed_at,
  };
}

async function getAttempt(studentId: string, date: string): Promise<AttemptRow | null> {
  const doc = await TeacherStudentDailyAttempt.findOne({
    student_id: studentId,
    attempt_date: date,
  }).lean();
  if (!doc) return null;
  return {
    question_ids: doc.question_ids,
    answers: doc.answers.map((a: any) => ({
      question_id: a.question_id,
      selected_option: a.selected_option,
      is_correct: a.is_correct,
    })),
    correct_count: doc.correct_count,
    xp_awarded: doc.xp_awarded,
    completed_at: doc.completed_at.toISOString(),
  };
}

async function getQuestionsByIds(ids: string[]): Promise<QuestionRow[]> {
  if (ids.length === 0) return [];
  const docs = await TeacherQuestion.find({
    _id: { $in: ids },
    is_active: true,
  }).lean();

  const byId = new Map(docs.map((q) => [q._id.toString(), q]));
  return ids
    .map((id) => {
      const q = byId.get(id);
      if (!q) return null;
      return {
        id: q._id.toString(),
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        correct_option: q.correct_option as "A" | "B" | "C",
        explanation: q.explanation,
      };
    })
    .filter(Boolean) as QuestionRow[];
}

async function getRandomQuestions(): Promise<QuestionRow[]> {
  const docs = await TeacherQuestion.find({ is_active: true })
    .limit(250)
    .lean();

  const shuffled = shuffle(docs);
  return shuffled.slice(0, DAILY_QUESTION_COUNT).map((q) => ({
    id: q._id.toString(),
    question: q.question,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    correct_option: q.correct_option as "A" | "B" | "C",
    explanation: q.explanation,
  }));
}

export async function GET(req: NextRequest) {
  await connectDB();

  const session = getAnyStudentId(req);
  if (session instanceof NextResponse) return session;

  const date = todayKey();
  const stats = await ensureStudentStats(session.studentId);
  const attempt = await getAttempt(session.studentId, date);

  if (attempt) {
    const questions = await getQuestionsByIds(attempt.question_ids);
    const response: StudentDailyQuizResponse = {
      date,
      completed: true,
      stats,
      questions: publicQuestions(questions),
      result: buildAttemptResult(questions, attempt),
    };
    return NextResponse.json(response);
  }

  const questions = await getRandomQuestions();
  const response: StudentDailyQuizResponse = {
    date,
    completed: false,
    stats,
    questions: publicQuestions(questions),
  };
  return NextResponse.json(response);
}

export async function POST(req: NextRequest) {
  await connectDB();

  const session = getAnyStudentId(req);
  if (session instanceof NextResponse) return session;

  let body: { answers?: StudentDailyQuizAnswer[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const answers = body.answers ?? [];
  if (answers.length !== DAILY_QUESTION_COUNT) {
    return NextResponse.json({ error: `Cần trả lời đủ ${DAILY_QUESTION_COUNT} câu` }, { status: 400 });
  }

  const ids = answers.map((answer) => answer.question_id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== DAILY_QUESTION_COUNT) {
    return NextResponse.json({ error: "Câu hỏi bị trùng" }, { status: 400 });
  }
  if (answers.some((answer) => !["A", "B", "C"].includes(answer.selected_option))) {
    return NextResponse.json({ error: "Lựa chọn không hợp lệ" }, { status: 400 });
  }

  const date = todayKey();
  const existing = await getAttempt(session.studentId, date);
  if (existing) {
    const questions = await getQuestionsByIds(existing.question_ids);
    return NextResponse.json({
      date,
      completed: true,
      stats: await ensureStudentStats(session.studentId),
      questions: publicQuestions(questions),
      result: buildAttemptResult(questions, existing),
    } satisfies StudentDailyQuizResponse);
  }

  const questions = await getQuestionsByIds(ids);
  if (questions.length !== DAILY_QUESTION_COUNT) {
    return NextResponse.json({ error: "Một hoặc nhiều câu hỏi không hợp lệ" }, { status: 400 });
  }

  const correctMap = new Map(questions.map((q) => [q.id, q.correct_option]));
  const storedAnswers = answers.map((answer) => ({
    question_id: answer.question_id,
    selected_option: answer.selected_option,
    is_correct: correctMap.get(answer.question_id) === answer.selected_option,
  }));
  const correctCount = storedAnswers.filter((answer) => answer.is_correct).length;
  const xpAwarded = correctCount * XP_PER_CORRECT_ANSWER;

  try {
    const attemptDoc = await TeacherStudentDailyAttempt.create({
      student_id: session.studentId,
      attempt_date: date,
      question_ids: ids,
      answers: storedAnswers,
      correct_count: correctCount,
      xp_awarded: xpAwarded,
    });

    const attemptData: AttemptRow = {
      question_ids: attemptDoc.question_ids,
      answers: attemptDoc.answers.map((a: any) => ({
        question_id: a.question_id,
        selected_option: a.selected_option,
        is_correct: a.is_correct,
      })),
      correct_count: attemptDoc.correct_count,
      xp_awarded: attemptDoc.xp_awarded,
      completed_at: attemptDoc.completed_at.toISOString(),
    };

    await awardStudentXp({
      studentId: session.studentId,
      source: "daily_quiz",
      xp: xpAwarded,
      metadata: { date, correct_count: correctCount, total: DAILY_QUESTION_COUNT },
    });
    const stats = await completeDailyStreak(session.studentId);

    return NextResponse.json({
      date,
      completed: true,
      stats,
      questions: publicQuestions(questions),
      result: buildAttemptResult(questions, attemptData),
    } satisfies StudentDailyQuizResponse);
  } catch (error: any) {
    const current = await getAttempt(session.studentId, date);
    if (current) {
      const currentQuestions = await getQuestionsByIds(current.question_ids);
      return NextResponse.json({
        date,
        completed: true,
        stats: await ensureStudentStats(session.studentId),
        questions: publicQuestions(currentQuestions),
        result: buildAttemptResult(currentQuestions, current),
      } satisfies StudentDailyQuizResponse);
    }
    return NextResponse.json({ error: error.message || "Lỗi lưu kết quả" }, { status: 400 });
  }
}
