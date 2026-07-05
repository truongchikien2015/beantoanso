// GET /api/admin/topics — List all topics (admin only)
// POST /api/admin/topics — Create a topic (admin only)
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Topic } from "@/lib/db/models/Topic";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    await connectDB();
    const topics = await Topic.find({}).sort({ topic_order: 1 }).lean();
    const mapped = topics.map((t) => ({
      id: t._id.toString(),
      slug: t.slug,
      label: t.label,
      icon: t.icon,
      color: t.color,
      topic_order: t.topic_order,
      is_active: t.is_active,
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
    const { slug, label, icon, color, topic_order, is_active } = body;

    if (!slug || !label) {
      return NextResponse.json({ error: "Missing required fields: slug, label" }, { status: 400 });
    }

    const existing = await Topic.findOne({ slug }).lean();
    if (existing) {
      return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
    }

    const topic = await Topic.create({
      slug,
      label,
      icon: icon || "📚",
      color: color || "indigo",
      topic_order: topic_order !== undefined ? parseInt(String(topic_order), 10) : 0,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    });

    return NextResponse.json({
      data: {
        id: topic._id.toString(),
        slug: topic.slug,
        label: topic.label,
        icon: topic.icon,
        color: topic.color,
        topic_order: topic.topic_order,
        is_active: topic.is_active,
      },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
