// GET /api/student/steps/[stepId] — get step content (topic or quiz questions)
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherLearningPathStep } from "@/lib/db/models/TeacherLearningPathStep";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
import { TeacherQuestion } from "@/lib/db/models/TeacherQuestion";
import { TeacherQuestionSet } from "@/lib/db/models/TeacherQuestionSet";
import { Question } from "@/lib/db/models/Question";
import { Topic } from "@/lib/db/models/Topic";
import { getStudentId } from "@/lib/auth-helpers";
import type { StudentStepContent } from "@/types/teacher-content";
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
  const questions = await Question.find({
    topic_slug: topicSlug,
    is_active: true,
  })
    .sort({ created_at: 1 })
    .lean();

  return questions.map((q) => ({
    id: q._id.toString(),
    set_id: "public-question-bank",
    question: q.question,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    correct_option: q.correct_option,
    explanation: q.explanation,
    image_url: q.image_url,
    is_active: q.is_active,
    created_at: q.created_at.toISOString(),
    updated_at: q.updated_at.toISOString(),
  }));
}

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  await connectDB();

  const session = getStudentId(req);
  if (session instanceof NextResponse) return withCors(req, session);

  const { studentId } = session;
  const { stepId } = await params;

  const publicTopic = await resolvePublicTopic(stepId);
  if (publicTopic) {
    const questions = await getPublicTopicQuestions(publicTopic.slug);
    const result: StudentStepContent = {
      step_id: stepId,
      path_id: "public_path",
      step_type: "topic",
      topic_id: publicTopic._id.toString(),
      question_set_id: null,
      step_order: 1,
      topic: publicTopic.slug as any,
      topic_label: publicTopic.label,
      questions,
      question_count: questions.length,
    };

    return jsonWithCors(req, result);
  }

  const stepObjectId = toObjectId(stepId);
  const studentObjectId = toObjectId(studentId);

  // Get the step
  const step = await TeacherLearningPathStep.findOne({ _id: stepObjectId }).lean();

  if (!step) {
    return jsonWithCors(req, { error: "Không tìm thấy bước học" }, { status: 404 });
  }

  // Verify student is assigned to this path
  const student = await TeacherStudent.findOne({ _id: studentObjectId, is_active: true })
    .select("assigned_path_id created_by")
    .lean();

  if (!student || student.assigned_path_id?.toString() !== step.path_id.toString()) {
    return jsonWithCors(req, { error: "Bạn không có quyền truy cập bước học này" }, { status: 403 });
  }

  const result: StudentStepContent = {
    step_id: step._id.toString(),
    path_id: step.path_id.toString(),
    step_type: step.step_type,
    topic_id: step.topic_id,
    question_set_id: step.question_set_id?.toString() ?? null,
    step_order: step.step_order,
  };

  if (step.step_type === "topic" && step.topic_id) {
    result.topic = step.topic_id as import("@/data/quizQuestions").QuizTopic;
    result.topic_label = getTopicLabel(result.topic);

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
        .limit(20)
        .lean();

      result.questions = questions.map((q) => ({
        id: q._id.toString(),
        set_id: q.set_id.toString(),
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        correct_option: q.correct_option as "A" | "B" | "C",
        explanation: q.explanation,
        image_url: q.image_url,
        is_active: q.is_active,
        created_at: q.created_at.toISOString(),
        updated_at: q.updated_at.toISOString(),
      }));
      result.question_count = result.questions.length;
    }
  }

  if (step.step_type === "question_set" && step.question_set_id) {
    const questions = await TeacherQuestion.find({
      set_id: step.question_set_id,
      is_active: true,
    }).lean();

    result.questions = questions.map((q) => ({
      id: q._id.toString(),
      set_id: q.set_id.toString(),
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      correct_option: q.correct_option as "A" | "B" | "C",
      explanation: q.explanation,
      image_url: q.image_url,
      is_active: q.is_active,
      created_at: q.created_at.toISOString(),
      updated_at: q.updated_at.toISOString(),
    }));
    result.question_count = questions.length;
  }

  return jsonWithCors(req, result);
}

function getTopicLabel(topic: string): string {
  const labels: Record<string, string> = {
    stranger: "Người lạ nhắn tin",
    phishing: "Link lạ và lừa đảo",
    password: "Mật khẩu và tài khoản",
    privacy: "Bảo vệ thông tin cá nhân",
    behavior: "Ứng xử văn minh trên mạng",
    screentime: "Thời gian dùng màn hình",
    badcontent: "Nội dung xấu và tin giả",
  };
  return labels[topic] ?? topic;
}
