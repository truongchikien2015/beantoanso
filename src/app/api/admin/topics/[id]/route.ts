import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Topic } from "@/lib/db/models/Topic";
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
    const { slug, label, icon, color, topic_order, is_active } = body;

    const updates: Record<string, any> = {};
    if (slug !== undefined) updates.slug = slug;
    if (label !== undefined) updates.label = label;
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;
    if (topic_order !== undefined) updates.topic_order = parseInt(String(topic_order), 10);
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await connectDB();

    if (slug) {
      const existing = await Topic.findOne({ slug, _id: { $ne: toObjectId(id) } }).lean();
      if (existing) {
        return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
      }
    }

    const topic = await Topic.findOneAndUpdate(
      { _id: toObjectId(id) },
      updates,
      { new: true }
    ).lean();

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

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
    const topic = await Topic.findOneAndDelete({ _id: toObjectId(id) });
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { id } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
