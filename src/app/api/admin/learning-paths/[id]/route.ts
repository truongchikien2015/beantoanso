import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { LearningPath } from "@/lib/db/models/LearningPath";
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
    const { title, description, topic_ids, is_active } = body;

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (topic_ids !== undefined) updates.topic_ids = topic_ids;
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await connectDB();

    const path = await LearningPath.findOneAndUpdate(
      { _id: toObjectId(id) },
      updates,
      { new: true }
    ).lean();

    if (!path) {
      return NextResponse.json({ error: "Learning Path not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: path._id.toString(),
        title: path.title,
        description: path.description,
        topic_ids: path.topic_ids,
        is_active: path.is_active,
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
    const path = await LearningPath.findOneAndDelete({ _id: toObjectId(id) });
    if (!path) {
      return NextResponse.json({ error: "Learning Path not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { id } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
