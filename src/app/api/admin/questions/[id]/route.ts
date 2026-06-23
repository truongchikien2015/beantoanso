import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Question } from "@/lib/db/models/Question";
import mongoose from "mongoose";

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  const crypto = require("crypto");
  const hash = crypto.createHash("md5").update(id.toString()).digest("hex");
  return new mongoose.Types.ObjectId(hash.substring(0, 24));
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { id } = await params;

  try {
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

    const updates: Record<string, any> = {};
    if (topic_slug !== undefined) updates.topic_slug = topic_slug;
    if (question !== undefined) updates.question = question;
    if (option_a !== undefined) updates.option_a = option_a;
    if (option_b !== undefined) updates.option_b = option_b;
    if (option_c !== undefined) updates.option_c = option_c;
    if (correct_option !== undefined) updates.correct_option = correct_option;
    if (explanation !== undefined) updates.explanation = explanation;
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    if (min_age !== undefined) updates.min_age = parseInt(String(min_age), 10);
    if (max_age !== undefined) updates.max_age = parseInt(String(max_age), 10);
    if (target_gender !== undefined) updates.target_gender = target_gender;
    if (image_url !== undefined) updates.image_url = image_url;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await connectDB();

    const q = await Question.findOneAndUpdate(
      { _id: toObjectId(id) },
      updates,
      { new: true }
    ).lean();

    if (!q) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

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
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { id } = await params;

  try {
    await connectDB();
    const q = await Question.findOneAndDelete({ _id: toObjectId(id) });
    if (!q) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { id } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
