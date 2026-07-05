// GET /api/student/questions — Get active questions from MongoDB with filters
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Question } from "@/lib/db/models/Question";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const topic_slug = searchParams.get("topic_slug");
    const ageStr = searchParams.get("age");
    const gender = searchParams.get("gender");

    const query: any = { is_active: true };

    if (topic_slug) {
      query.topic_slug = topic_slug;
    }

    if (ageStr) {
      const age = parseInt(ageStr, 10);
      if (!isNaN(age)) {
        query.min_age = { $lte: age };
        query.max_age = { $gte: age };
      }
    }

    if (gender) {
      query.target_gender = { $in: ["all", gender] };
    }

    const questions = await Question.find(query).lean();

    const mapped = questions.map((q) => ({
      id: q._id.toString(),
      topic_slug: q.topic_slug,
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      correct_option: q.correct_option,
      explanation: q.explanation,
      is_active: q.is_active,
      min_age: q.min_age,
      max_age: q.max_age,
      target_gender: q.target_gender,
      image_url: q.image_url,
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error("GET /api/student/questions error:", err);
    return NextResponse.json({ error: "Lỗi kết nối cơ sở dữ liệu" }, { status: 500 });
  }
}
