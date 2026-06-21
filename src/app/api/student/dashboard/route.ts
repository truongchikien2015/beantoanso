// GET /api/student/dashboard — student info, assigned path, steps, progress
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherStudent } from "@/lib/db/models/TeacherStudent";
import { TeacherLearningPath } from "@/lib/db/models/TeacherLearningPath";
import { TeacherLearningPathStep } from "@/lib/db/models/TeacherLearningPathStep";
import { TeacherStudentProgress } from "@/lib/db/models/TeacherStudentProgress";
import { Profile } from "@/lib/db/models/Profile";
import { getAnyStudentId } from "@/lib/auth-helpers";
import { ensureStudentStats } from "@/lib/server/studentRewards";

export async function GET(req: NextRequest) {
  await connectDB();

  const session = getAnyStudentId(req);
  if (session instanceof NextResponse) return session;

  const { studentId, accountType } = session;
  const stats = await ensureStudentStats(studentId);

  // Self-registered students live in `profiles`, not in teacher_students.
  if (accountType === "self") {
    const profile = await Profile.findOne({ _id: studentId } as any).lean();

    return NextResponse.json({
      student: {
        id: studentId,
        nickname: profile?.full_name ?? "Bé học sinh",
        email: null,
        class_name: null,
        student_code: "",
        assigned_path_id: null,
      },
      assigned_path: null,
      progress: [],
      stats,
    });
  }

  // Get student info
  const student = await TeacherStudent.findOne({ _id: studentId, is_active: true })
    .select("nickname email class_name student_code assigned_path_id")
    .lean();

  if (!student) {
    return NextResponse.json({ error: "Không tìm thấy học sinh" }, { status: 404 });
  }

  const studentData = {
    id: student._id.toString(),
    nickname: student.nickname,
    email: student.email,
    class_name: student.class_name,
    student_code: student.student_code,
    assigned_path_id: student.assigned_path_id?.toString() ?? null,
  };

  // No assigned path → return empty
  if (!student.assigned_path_id) {
    return NextResponse.json({
      student: studentData,
      assigned_path: null,
      progress: [],
      stats,
    });
  }

  // Get assigned path
  const path = await TeacherLearningPath.findOne({
    _id: student.assigned_path_id,
    is_active: true,
  })
    .select("title description created_at")
    .lean();

  if (!path) {
    return NextResponse.json({
      student: studentData,
      assigned_path: null,
      progress: [],
      stats,
    });
  }

  // Get steps in order
  const steps = await TeacherLearningPathStep.find({ path_id: path._id })
    .sort({ step_order: 1 })
    .select("path_id step_order step_type topic_id question_set_id")
    .lean();

  const mappedSteps = steps.map((s) => ({
    id: s._id.toString(),
    path_id: s.path_id.toString(),
    step_order: s.step_order,
    step_type: s.step_type,
    topic_id: s.topic_id,
    question_set_id: s.question_set_id?.toString() ?? null,
  }));

  // Get progress for this student + path
  const progress = await TeacherStudentProgress.find({
    student_id: studentId,
    path_id: path._id,
  })
    .select("student_id path_id step_id score completed_at")
    .lean();

  const mappedProgress = progress.map((p) => ({
    id: p._id.toString(),
    student_id: p.student_id.toString(),
    path_id: p.path_id.toString(),
    step_id: p.step_id.toString(),
    score: p.score,
    completed_at: p.completed_at,
  }));

  return NextResponse.json({
    student: studentData,
    assigned_path: {
      id: path._id.toString(),
      title: path.title,
      description: path.description,
      created_at: path.created_at,
      steps: mappedSteps,
      step_count: mappedSteps.length,
    },
    progress: mappedProgress,
    stats,
  });
}
