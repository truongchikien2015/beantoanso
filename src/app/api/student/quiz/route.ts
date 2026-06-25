// POST /api/student/quiz — Submit a quiz result for a step
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherLearningPathStep } from "@/lib/db/models/TeacherLearningPathStep";
import { TeacherQuestion } from "@/lib/db/models/TeacherQuestion";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
import { TeacherQuestionSet } from "@/lib/db/models/TeacherQuestionSet";
import { TeacherStudentProgress } from "@/lib/db/models/TeacherStudentProgress";
import { Question } from "@/lib/db/models/Question";
import { Topic } from "@/lib/db/models/Topic";
import { getStudentId } from "@/lib/auth-helpers";
import {
  XP_PER_CORRECT_ANSWER,
  XP_TOPIC_COMPLETE,
  awardStudentXp,
} from "@/lib/server/studentRewards";
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

async function resolvePublicTopic(stepId: string) {
  if (mongoose.Types.ObjectId.isValid(stepId)) {
    return Topic.findById(stepId).lean();
  }

  return Topic.findOne({ slug: stepId, is_active: true }).lean();
}

async function getPublicTopicQuestions(topicSlug: string) {
  return Question.find({
    topic_slug: topicSlug,
    is_active: true,
  })
    .select("_id question option_a option_b option_c correct_option explanation")
    .sort({ created_at: 1 })
    .lean();
}

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(req: NextRequest) {
  await connectDB();

  const session = getStudentId(req);
  if (session instanceof NextResponse) return withCors(req, session);

  const { studentId } = session;

  let body: {
    path_id: string;
    step_id: string;
    score: number;
    answers?: Array<{ question_id: string; selected_option: "A" | "B" | "C" }>;
  };
  try {
    body = await req.json();
  } catch {
    return jsonWithCors(req, { error: "Invalid JSON" }, { status: 400 });
  }

  const { path_id, step_id, score, answers } = body;
  if (!path_id || !step_id || score === undefined) {
    return jsonWithCors(req, { error: "Missing required fields" }, { status: 400 });
  }

  const pathObjectId = toObjectId(path_id);
  const stepObjectId = toObjectId(step_id);
  const studentObjectId = toObjectId(studentId);
  const publicTopic = await resolvePublicTopic(step_id);
  const isPublicStep = Boolean(publicTopic);

  let questionsForScoring: Array<{ id: string; correct_option: string }> = [];
  let fullQuestions: any[] = [];
  let step: any = null;

  if (publicTopic) {
    const topicQuestions = await getPublicTopicQuestions(publicTopic.slug);

    questionsForScoring = topicQuestions.map((q) => ({
      id: q._id.toString(),
      correct_option: q.correct_option,
    }));

    fullQuestions = topicQuestions;
  } else {
    // Verify step belongs to this path
    step = await TeacherLearningPathStep.findOne({
      _id: stepObjectId,
    }).lean();

    if (!step || step.path_id.toString() !== path_id) {
      return jsonWithCors(req, { error: "Bước không hợp lệ" }, { status: 400 });
    }

    if (answers) {
      if (step.step_type === "question_set" && step.question_set_id) {
        const questions = await TeacherQuestion.find({
          set_id: step.question_set_id,
          is_active: true,
        })
          .select("_id correct_option")
          .lean();

        questionsForScoring = questions.map((q) => ({
          id: q._id.toString(),
          correct_option: q.correct_option,
        }));
      } else if (step.step_type === "topic" && step.topic_id) {
        const student = await TeacherStudent.findOne({
          _id: studentObjectId,
        })
          .select("created_by")
          .lean();

        if (student) {
          const sets = await TeacherQuestionSet.find({
            created_by: student.created_by,
            topic_id: step.topic_id,
            is_active: true,
          })
            .select("_id")
            .lean();

          const setIds = sets.map((set) => set._id);
          if (setIds.length > 0) {
            const questions = await TeacherQuestion.find({
              set_id: { $in: setIds },
              is_active: true,
            })
              .select("_id correct_option")
              .limit(20)
              .lean();

            questionsForScoring = questions.map((q) => ({
              id: q._id.toString(),
              correct_option: q.correct_option,
            }));
          }
        }
      }
    }
  }

  // Validate answers against real questions
  if (answers && questionsForScoring.length > 0) {
    const validQuestionIds = new Set(questionsForScoring.map((q) => q.id));

    for (const answer of answers) {
      if (!validQuestionIds.has(answer.question_id)) {
        return jsonWithCors(
          req,
          { error: `Câu hỏi không hợp lệ: ${answer.question_id}` },
          { status: 400 }
        );
      }
      if (!["A", "B", "C"].includes(answer.selected_option)) {
        return jsonWithCors(
          req,
          { error: "Lựa chọn không hợp lệ. Chỉ chấp nhận A, B, hoặc C." },
          { status: 400 }
        );
      }
    }
  }

  // Build answer breakdown for detailed feedback
  let answerBreakdown: Array<{
    question_id: string;
    question: string;
    selected_option: string;
    correct_option: string;
    is_correct: boolean;
    explanation: string | null;
    option_a: string;
    option_b: string;
    option_c: string;
  }> = [];

  if (answers && questionsForScoring.length > 0) {
    // Get full question data for breakdown
    let dbQuestions: any[] = [];

    if (isPublicStep) {
      dbQuestions = fullQuestions;
    } else if (step) {
      if (step.step_type === "question_set" && step.question_set_id) {
        dbQuestions = await TeacherQuestion.find({
          set_id: step.question_set_id,
          is_active: true,
        })
          .select("question option_a option_b option_c correct_option explanation")
          .lean();
      } else if (step.step_type === "topic" && step.topic_id) {
        const student = await TeacherStudent.findOne({
          _id: studentObjectId,
        })
          .select("created_by")
          .lean();

        if (student) {
          const sets = await TeacherQuestionSet.find({
            created_by: student.created_by,
            topic_id: step.topic_id,
            is_active: true,
          })
            .select("_id")
            .lean();

          const setIds = sets.map((set) => set._id);
          if (setIds.length > 0) {
            dbQuestions = await TeacherQuestion.find({
              set_id: { $in: setIds },
              is_active: true,
            })
              .select("question option_a option_b option_c correct_option explanation")
              .limit(20)
              .lean();
          }
        }
      }
    }

    const correctMap = new Map(questionsForScoring.map((q) => [q.id, q.correct_option]));
    const questionMap = new Map(dbQuestions.map((q) => [q._id ? q._id.toString() : q.id, q]));

    for (const answer of answers) {
      const q = questionMap.get(answer.question_id);
      const correctOpt = correctMap.get(answer.question_id);
      if (q && correctOpt) {
        answerBreakdown.push({
          question_id: answer.question_id,
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          selected_option: answer.selected_option,
          correct_option: correctOpt,
          is_correct: answer.selected_option === correctOpt,
          explanation: q.explanation,
        });
      }
    }
  }

  // Recalculate score from answers if provided
  let finalScore = score;
  if (answers && questionsForScoring.length > 0) {
    const correctMap = new Map(questionsForScoring.map((q) => [q.id, q.correct_option]));

    let correct = 0;
    let total = correctMap.size;
    let unanswered = 0;

    for (const [qId, correctOpt] of correctMap) {
      const answer = answers.find((a) => a.question_id === qId);
      if (!answer) {
        unanswered++;
      } else if (answer.selected_option === correctOpt) {
        correct++;
      }
    }

    finalScore = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Upsert student progress in MongoDB
    const progressDoc = await TeacherStudentProgress.findOneAndUpdate(
      { student_id: studentObjectId, step_id: stepObjectId },
      {
        path_id: pathObjectId,
        score: finalScore,
        completed_at: new Date(),
        ...(publicTopic ? { topic_slug: publicTopic.slug } : {}),
      },
      { upsert: true, new: true }
    ).lean();

    const xpAwarded = correct * XP_PER_CORRECT_ANSWER;
    const stats = await awardStudentXp({
      studentId,
      source: "step_quiz",
      xp: xpAwarded,
      metadata: { path_id, step_id, score: finalScore, correct, total },
    });

    const progress = {
      id: progressDoc._id.toString(),
      student_id: progressDoc.student_id.toString(),
      path_id: progressDoc.path_id.toString(),
      step_id: progressDoc.step_id.toString(),
      score: progressDoc.score,
      completed_at: progressDoc.completed_at,
    };

    return jsonWithCors(req, {
      success: true,
      progress,
      stats,
      xp_awarded: xpAwarded,
      breakdown: {
        total,
        correct,
        unanswered,
        score: finalScore,
      },
      answer_breakdown: answerBreakdown,
    });
  }

  // Topic type or no answers — just upsert score
  const progressDoc = await TeacherStudentProgress.findOneAndUpdate(
    { student_id: studentObjectId, step_id: stepObjectId },
    {
      path_id: pathObjectId,
      score: Math.max(0, Math.min(100, finalScore)),
      completed_at: new Date(),
      ...(publicTopic ? { topic_slug: publicTopic.slug } : {}),
    },
    { upsert: true, new: true }
  ).lean();

  const isTopicType = isPublicStep || (step && step.step_type === "topic");
  const xpAwarded = isTopicType ? XP_TOPIC_COMPLETE : 0;
  const stats = await awardStudentXp({
    studentId,
    source: isTopicType ? "topic_complete" : "step_quiz",
    xp: xpAwarded,
    metadata: { path_id, step_id, score: progressDoc.score, step_type: isTopicType ? "topic" : (step?.step_type ?? "quiz") },
  });

  const progress = {
    id: progressDoc._id.toString(),
    student_id: progressDoc.student_id.toString(),
    path_id: progressDoc.path_id.toString(),
    step_id: progressDoc.step_id.toString(),
    score: progressDoc.score,
    completed_at: progressDoc.completed_at,
  };

  return jsonWithCors(req, { success: true, progress, stats, xp_awarded: xpAwarded });
}
