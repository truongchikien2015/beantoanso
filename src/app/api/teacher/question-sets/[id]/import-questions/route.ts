// POST /api/teacher/question-sets/[id]/import-questions
// Batch import questions from Excel file
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherQuestionSet } from "@/lib/db/models/TeacherQuestionSet";
import { TeacherQuestion } from "@/lib/db/models/TeacherQuestion";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { CreateQuestionInput, QuestionImportResult } from "@/types/teacher-content";
import mongoose from "mongoose";

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  const crypto = require("crypto");
  const hash = crypto.createHash("md5").update(id.toString()).digest("hex");
  return new mongoose.Types.ObjectId(hash.substring(0, 24));
}

type RouteContext = { params: Promise<{ id: string }> };

const MAX_QUESTIONS_PER_REQUEST = 500;

export async function POST(req: NextRequest, context: RouteContext) {
  // Auth
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;
  const { id: setId } = await context.params;

  await connectDB();

  const setObjectId = toObjectId(setId);

  // Verify question set ownership
  const questionSet = await TeacherQuestionSet.findOne({
    _id: setObjectId,
    created_by: uid,
    is_active: true,
  }).lean();

  if (!questionSet) {
    return NextResponse.json({ error: "Bộ câu hỏi không tìm thấy" }, { status: 404 });
  }

  // Parse body
  let body: { questions: CreateQuestionInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { questions } = body;

  // Validate input
  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "Danh sách câu hỏi trống" }, { status: 400 });
  }

  if (questions.length > MAX_QUESTIONS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Số câu hỏi vượt quá giới hạn (tối đa ${MAX_QUESTIONS_PER_REQUEST})` },
      { status: 400 }
    );
  }

  // Validate each question
  const errors: Array<{ row: number; message: string }> = [];
  const validQuestions: Array<{ set_id: string; question: string; option_a: string; option_b: string; option_c: string; correct_option: string; explanation: string | null }> = [];

  questions.forEach((q, index) => {
    const rowNum = index + 1;

    if (!q.question || !q.question.trim()) {
      errors.push({ row: rowNum, message: "Thiếu nội dung câu hỏi" });
      return;
    }

    if (!q.option_a || !q.option_a.trim()) {
      errors.push({ row: rowNum, message: "Thiếu đáp án A" });
      return;
    }

    if (!q.option_b || !q.option_b.trim()) {
      errors.push({ row: rowNum, message: "Thiếu đáp án B" });
      return;
    }

    if (!q.option_c || !q.option_c.trim()) {
      errors.push({ row: rowNum, message: "Thiếu đáp án C" });
      return;
    }

    const correct = q.correct_option?.toUpperCase();
    if (!["A", "B", "C"].includes(correct)) {
      errors.push({ row: rowNum, message: `Đáp án đúng phải là A, B hoặc C` });
      return;
    }

    validQuestions.push({
      set_id: setId,
      question: q.question.trim(),
      option_a: q.option_a.trim(),
      option_b: q.option_b.trim(),
      option_c: q.option_c.trim(),
      correct_option: correct,
      explanation: q.explanation?.trim() || null,
    });
  });

  // Insert valid questions
  let created = 0;
  if (validQuestions.length > 0) {
    const docs = validQuestions.map((q) => ({
      question_set_id: toObjectId(q.set_id),
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      correct_option: q.correct_option,
      explanation: q.explanation,
      is_active: true,
    }));

    try {
      await TeacherQuestion.insertMany(docs);
      created = validQuestions.length;
    } catch (insertError: any) {
      return NextResponse.json(
        { error: `Lỗi khi lưu: ${insertError.message}` },
        { status: 500 }
      );
    }
  }

  const result: QuestionImportResult = {
    total: questions.length,
    created,
    failed: errors.length,
    errors,
  };

  return NextResponse.json(result);
}
