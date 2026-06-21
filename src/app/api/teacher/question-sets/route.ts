// GET /api/teacher/question-sets — list all question sets for the authenticated teacher
// POST /api/teacher/question-sets — create a new question set
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherQuestionSet } from "@/lib/db/models/TeacherQuestionSet";
import { TeacherQuestion } from "@/lib/db/models/TeacherQuestion";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { CreateQuestionSetInput } from "@/types/teacher-content";

// GET /api/teacher/question-sets
export async function GET(req: NextRequest) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;

  await connectDB();

  const sets = await TeacherQuestionSet.find({ created_by: uid, is_active: true })
    .sort({ created_at: -1 })
    .lean();

  // Count questions for each set
  const setsWithCount = await Promise.all(
    sets.map(async (s) => {
      const count = await TeacherQuestion.countDocuments({ set_id: s._id });
      return {
        id: s._id.toString(),
        created_by: s.created_by,
        title: s.title,
        topic_id: s.topic_id,
        description: s.description,
        is_active: s.is_active,
        created_at: s.created_at,
        updated_at: s.updated_at,
        question_count: count,
      };
    })
  );

  return NextResponse.json(setsWithCount);
}

// POST /api/teacher/question-sets
export async function POST(req: NextRequest) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;

  let body: CreateQuestionSetInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, topic_id, description } = body;
  if (!title || !topic_id) {
    return NextResponse.json({ error: "Missing required fields: title, topic_id" }, { status: 400 });
  }

  await connectDB();

  const doc = await TeacherQuestionSet.create({
    created_by: uid,
    title,
    topic_id,
    description: description ?? null,
  });

  return NextResponse.json({
    id: doc._id.toString(),
    created_by: doc.created_by,
    title: doc.title,
    topic_id: doc.topic_id,
    description: doc.description,
    is_active: doc.is_active,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  }, { status: 201 });
}
