// POST /api/student/quiz — Submit a quiz result for a step
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getStudentId } from "@/lib/auth-helpers";
import {
  XP_PER_CORRECT_ANSWER,
  XP_TOPIC_COMPLETE,
  awardStudentXp,
} from "@/lib/server/studentRewards";

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const session = getStudentId(req);
  if (session instanceof NextResponse) return session;

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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { path_id, step_id, score, answers } = body;
  if (!path_id || !step_id || score === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify step belongs to this path
  const { data: step } = await supabaseAdmin
    .from("teacher_learning_path_steps")
    .select("id, path_id, step_type, topic_id, question_set_id")
    .eq("id", step_id)
    .single();

  if (!step || step.path_id !== path_id) {
    return NextResponse.json({ error: "Bước không hợp lệ" }, { status: 400 });
  }

  let questionsForScoring: Array<{ id: string; correct_option: string }> = [];
  if (answers) {
    if (step.step_type === "question_set" && step.question_set_id) {
      const { data: questions } = await supabaseAdmin
        .from("teacher_questions")
        .select("id, correct_option")
        .eq("set_id", step.question_set_id)
        .eq("is_active", true);

      questionsForScoring = questions ?? [];
    } else if (step.step_type === "topic" && step.topic_id) {
      const { data: student } = await supabaseAdmin
        .from("teacher_students")
        .select("created_by")
        .eq("id", studentId)
        .single();

      const { data: sets } = await supabaseAdmin
        .from("teacher_question_sets")
        .select("id")
        .eq("created_by", student?.created_by)
        .eq("topic_id", step.topic_id)
        .eq("is_active", true);

      const setIds = (sets ?? []).map((set) => set.id);
      if (setIds.length > 0) {
        const { data: questions } = await supabaseAdmin
          .from("teacher_questions")
          .select("id, correct_option")
          .in("set_id", setIds)
          .eq("is_active", true)
          .limit(20);

        questionsForScoring = questions ?? [];
      }
    }
  }

  // Validate answers against real questions
  if (answers && questionsForScoring.length > 0) {
    const validQuestionIds = new Set(questionsForScoring.map((q) => q.id));

    for (const answer of answers) {
      if (!validQuestionIds.has(answer.question_id)) {
        return NextResponse.json(
          { error: `Câu hỏi không hợp lệ: ${answer.question_id}` },
          { status: 400 }
        );
      }
      if (!["A", "B", "C"].includes(answer.selected_option)) {
        return NextResponse.json(
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
    let fullQuestions: Array<{
      id: string;
      question: string;
      option_a: string;
      option_b: string;
      option_c: string;
      correct_option: string;
      explanation: string | null;
    }> = [];

    if (step.step_type === "question_set" && step.question_set_id) {
      const { data: questions } = await supabaseAdmin
        .from("teacher_questions")
        .select("id, question, option_a, option_b, option_c, correct_option, explanation")
        .eq("set_id", step.question_set_id)
        .eq("is_active", true);
      fullQuestions = questions ?? [];
    } else if (step.step_type === "topic" && step.topic_id) {
      const { data: student } = await supabaseAdmin
        .from("teacher_students")
        .select("created_by")
        .eq("id", studentId)
        .single();

      const { data: sets } = await supabaseAdmin
        .from("teacher_question_sets")
        .select("id")
        .eq("created_by", student?.created_by)
        .eq("topic_id", step.topic_id)
        .eq("is_active", true);

      const setIds = (sets ?? []).map((set) => set.id);
      if (setIds.length > 0) {
        const { data: questions } = await supabaseAdmin
          .from("teacher_questions")
          .select("id, question, option_a, option_b, option_c, correct_option, explanation")
          .in("set_id", setIds)
          .eq("is_active", true)
          .limit(20);
        fullQuestions = questions ?? [];
      }
    }

    const correctMap = new Map(questionsForScoring.map((q) => [q.id, q.correct_option]));
    const questionMap = new Map(fullQuestions.map((q) => [q.id, q]));

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
    const answeredIds = new Set(answers.map((a) => a.question_id));

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

    // Store answers in progress as JSON
    const { data: progress, error } = await supabaseAdmin
      .from("teacher_student_progress")
      .upsert({
        student_id: studentId,
        path_id,
        step_id,
        score: finalScore,
        completed_at: new Date().toISOString(),
      }, { onConflict: "student_id,step_id" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const xpAwarded = correct * XP_PER_CORRECT_ANSWER;
    const stats = await awardStudentXp({
      studentId,
      source: "step_quiz",
      xp: xpAwarded,
      metadata: { path_id, step_id, score: finalScore, correct, total },
    });

    return NextResponse.json({
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
  const { data, error } = await supabaseAdmin
    .from("teacher_student_progress")
    .upsert({
      student_id: studentId,
      path_id,
      step_id,
      score: Math.max(0, Math.min(100, finalScore)),
      completed_at: new Date().toISOString(),
    }, { onConflict: "student_id,step_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const xpAwarded = step.step_type === "topic" ? XP_TOPIC_COMPLETE : 0;
  const stats = await awardStudentXp({
    studentId,
    source: step.step_type === "topic" ? "topic_complete" : "step_quiz",
    xp: xpAwarded,
    metadata: { path_id, step_id, score: data.score, step_type: step.step_type },
  });

  return NextResponse.json({ success: true, progress: data, stats, xp_awarded: xpAwarded });
}
