// GET /api/student/topics — Get active topics from MongoDB
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Topic } from "@/lib/db/models/Topic";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const topics = await Topic.find({ is_active: true }).sort({ topic_order: 1 }).lean();

    const mapped = topics.map((t) => ({
      id: t._id.toString(),
      slug: t.slug,
      label: t.label,
      icon: t.icon,
      color: t.color,
      topic_order: t.topic_order,
      is_active: t.is_active,
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error("GET /api/student/topics error:", err);
    return NextResponse.json({ error: "Lỗi kết nối cơ sở dữ liệu" }, { status: 500 });
  }
}
