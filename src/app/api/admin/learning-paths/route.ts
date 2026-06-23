import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { LearningPath } from "@/lib/db/models/LearningPath";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    await connectDB();
    const paths = await LearningPath.find({}).sort({ createdAt: -1 }).lean();
    const mapped = paths.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      description: p.description,
      topic_ids: p.topic_ids || [],
      is_active: p.is_active,
    }));
    return NextResponse.json({ data: mapped });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    await connectDB();
    const body = await req.json();
    const { title, description, topic_ids, is_active } = body;

    if (!title) {
      return NextResponse.json({ error: "Missing required field: title" }, { status: 400 });
    }

    const path = await LearningPath.create({
      title,
      description: description || "",
      topic_ids: topic_ids || [],
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    });

    return NextResponse.json({
      data: {
        id: path._id.toString(),
        title: path.title,
        description: path.description,
        topic_ids: path.topic_ids,
        is_active: path.is_active,
      },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
