// POST /api/teacher/question-sets/[id]/import-questions
// Batch import questions from Excel file
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { CreateQuestionInput, QuestionImportResult } from "@/types/teacher-content";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_QUESTIONS_PER_REQUEST = 500;

export async function POST(req: NextRequest, context: RouteContext) {
  // Auth
  const authResult = getTeacherUid(req);
  if (authResult instanceof NextResponse) return authResult;
  const { uid } = authResult;
  const { id: setId } = await context.params;

  // Verify question set ownership
  const { data: questionSet, error: setError } = await supabaseAdmin!
    .from("teacher_question_sets")
    .select("id, title")
    .eq("id", setId)
    .eq("created_by", uid)
    .single();

  if (setError || !questionSet) {
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
    const { error: insertError } = await supabaseAdmin!
      .from("teacher_questions")
      .insert(validQuestions);

    if (insertError) {
      return NextResponse.json(
        { error: `Lỗi khi lưu: ${insertError.message}` },
        { status: 500 }
      );
    }
    created = validQuestions.length;
  }

  const result: QuestionImportResult = {
    total: questions.length,
    created,
    failed: errors.length,
    errors,
  };

  return NextResponse.json(result);
}
