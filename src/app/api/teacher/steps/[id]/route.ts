// DELETE /api/teacher/steps/[id]
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeacherLearningPathStep } from "@/lib/db/models/TeacherLearningPathStep";
import { TeacherLearningPath } from "@/lib/db/models/TeacherLearningPath";
import { getTeacherUid } from "@/lib/auth-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, context: RouteContext) {
  const result = getTeacherUid(req);
  if (result instanceof NextResponse) return result;
  const { uid } = result;
  const { id } = await context.params;

  await connectDB();

  // Find step and verify ownership via path
  const step = await TeacherLearningPathStep.findById(id).lean();
  if (!step) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const path = await TeacherLearningPath.findOne({ _id: step.path_id, created_by: uid }).lean();
  if (!path) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await TeacherLearningPathStep.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
