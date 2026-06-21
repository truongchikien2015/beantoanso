// PUT /api/teacher/learning-paths/[id]/steps/reorder
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherLearningPath } from "@/lib/db/models/TeacherLearningPath";
import { TeacherLearningPathStep } from "@/lib/db/models/TeacherLearningPathStep";
import { getTeacherUid } from "@/lib/auth-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id: pathId } = await context.params;

  await connectDB();

  const path = await TeacherLearningPath.findOne({ _id: pathId, created_by: uid }).lean();
  if (!path) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { steps: { id: string; step_order: number }[] };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { steps } = body;
  if (!Array.isArray(steps) || steps.length === 0) {
    return NextResponse.json({ error: "steps array required" }, { status: 400 });
  }

  await Promise.all(
    steps.map((s) =>
      TeacherLearningPathStep.findOneAndUpdate(
        { _id: s.id, path_id: pathId },
        { step_order: s.step_order }
      )
    )
  );

  return NextResponse.json({ success: true });
}
