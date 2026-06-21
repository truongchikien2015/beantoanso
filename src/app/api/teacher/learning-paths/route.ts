// GET /api/teacher/learning-paths — list all learning paths for the authenticated teacher
// POST /api/teacher/learning-paths — create a new learning path
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherLearningPath } from "@/lib/db/models/TeacherLearningPath";
import { TeacherLearningPathStep } from "@/lib/db/models/TeacherLearningPathStep";
import { getTeacherUid } from "@/lib/auth-helpers";
import type { CreateLearningPathInput } from "@/types/teacher-content";

export async function GET(req: NextRequest) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;

  await connectDB();

  const data = await TeacherLearningPath.find({ created_by: uid, is_active: true })
    .sort({ created_at: -1 })
    .lean();

  const paths = await Promise.all(
    data.map(async (p) => {
      const stepCount = await TeacherLearningPathStep.countDocuments({ path_id: p._id });
      return {
        id: p._id.toString(), created_by: p.created_by, title: p.title,
        description: p.description, is_active: p.is_active,
        created_at: p.created_at, updated_at: p.updated_at,
        step_count: stepCount,
      };
    })
  );

  return NextResponse.json(paths);
}

export async function POST(req: NextRequest) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;

  let body: CreateLearningPathInput;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description } = body;
  if (!title) return NextResponse.json({ error: "Missing required field: title" }, { status: 400 });

  await connectDB();

  const doc = await TeacherLearningPath.create({
    created_by: uid, title, description: description ?? null,
  });

  return NextResponse.json({
    id: doc._id.toString(), created_by: doc.created_by, title: doc.title,
    description: doc.description, is_active: doc.is_active,
    created_at: doc.created_at, updated_at: doc.updated_at,
  }, { status: 201 });
}
