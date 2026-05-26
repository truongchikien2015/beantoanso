// GET /api/student/steps/[stepId] — get step content (topic or quiz questions)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getStudentId } from "@/lib/auth-helpers";
import type { StudentStepContent } from "@/types/teacher-content";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const session = getStudentId(req);
  if (session instanceof NextResponse) return session;

  const { studentId } = session;
  const { stepId } = await params;

  // Get the step
  const { data: step, error: stepError } = await supabaseAdmin
    .from("teacher_learning_path_steps")
    .select("id, path_id, step_order, step_type, topic_id, question_set_id")
    .eq("id", stepId)
    .single();

  if (stepError || !step) {
    return NextResponse.json({ error: "Không tìm thấy bước học" }, { status: 404 });
  }

  // Verify student is assigned to this path
  const { data: student } = await supabaseAdmin
    .from("teacher_students")
    .select("assigned_path_id, created_by")
    .eq("id", studentId)
    .single();

  if (!student || student.assigned_path_id !== step.path_id) {
    return NextResponse.json({ error: "Bạn không có quyền truy cập bước học này" }, { status: 403 });
  }

  const result: StudentStepContent = {
    step_id: step.id,
    path_id: step.path_id,
    step_type: step.step_type,
    topic_id: step.topic_id,
    question_set_id: step.question_set_id,
    step_order: step.step_order,
  };

  if (step.step_type === "topic" && step.topic_id) {
    result.topic = step.topic_id as import("@/data/quizQuestions").QuizTopic;
    result.topic_label = getTopicLabel(result.topic);

    const { data: sets } = await supabaseAdmin
      .from("teacher_question_sets")
      .select("id")
      .eq("created_by", student.created_by)
      .eq("topic_id", step.topic_id)
      .eq("is_active", true);

    const setIds = (sets ?? []).map((set) => set.id);
    if (setIds.length > 0) {
      const { data: questions } = await supabaseAdmin
        .from("teacher_questions")
        .select("id, set_id, question, option_a, option_b, option_c, correct_option, explanation, is_active, created_at, updated_at")
        .in("set_id", setIds)
        .eq("is_active", true)
        .limit(20);

      result.questions = (questions ?? []).map((q) => ({
        ...q,
        correct_option: q.correct_option as "A" | "B" | "C",
      }));
      result.question_count = result.questions.length;
    }
  }

  if (step.step_type === "question_set" && step.question_set_id) {
    const { data: questions } = await supabaseAdmin
      .from("teacher_questions")
      .select("id, set_id, question, option_a, option_b, option_c, correct_option, explanation, is_active, created_at, updated_at")
      .eq("set_id", step.question_set_id)
      .eq("is_active", true);

    result.questions = (questions ?? []).map((q) => ({
      ...q,
      correct_option: q.correct_option as "A" | "B" | "C",
    }));
    result.question_count = (questions ?? []).length;
  }

  return NextResponse.json(result);
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
