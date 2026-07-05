import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { LearningPath } from "@/lib/db/models/LearningPath";
import { corsOptions, jsonWithCors } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const paths = await LearningPath.find({ is_active: true }).sort({ createdAt: 1 }).lean();
    const mapped = paths.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      description: p.description,
      topic_ids: p.topic_ids || [],
      is_active: p.is_active,
    }));
    return jsonWithCors(req, { data: mapped });
  } catch (err: any) {
    return jsonWithCors(req, { error: err.message }, { status: 500 });
  }
}
