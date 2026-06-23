import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Question } from "@/lib/db/models/Question";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    await connectDB();
    const questions = await Question.find({}).sort({ createdAt: -1 }).lean();
    const mapped = questions.map((q) => ({
      id: q._id.toString(),
      topic_slug: q.topic_slug,
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      correct_option: q.correct_option,
      explanation: q.explanation || "",
      is_active: q.is_active,
      min_age: q.min_age,
      max_age: q.max_age,
      target_gender: q.target_gender,
      image_url: q.image_url,
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
    const {
      topic_slug,
      question,
      option_a,
      option_b,
      option_c,
      correct_option,
      explanation,
      is_active,
      min_age,
      max_age,
      target_gender,
      image_url,
    } = body;

    if (!topic_slug || !question || !option_a || !option_b || !option_c || !correct_option) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const q = await Question.create({
      topic_slug,
      question,
      option_a,
      option_b,
      option_c,
      correct_option,
      explanation: explanation || "",
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      min_age: min_age !== undefined ? parseInt(String(min_age), 10) : 0,
      max_age: max_age !== undefined ? parseInt(String(max_age), 10) : 99,
      target_gender: target_gender || "all",
      image_url: image_url || null,
    });

    return NextResponse.json({
      data: {
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
      },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
