import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Result } from "@/lib/db/models/Result";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await connectDB();
    const result = await Result.findById(id).lean();
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      data: {
        id: result._id.toString(),
        player_id: result.player_id,
        nickname: result.nickname,
        mission_score: result.mission_score,
        quiz_score: result.quiz_score,
        total_score: result.total_score,
        title: result.title,
        badge: result.badge,
        created_at: result.completed_at,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, player_id, nickname, mission_score, quiz_score, total_score, title, badge } = body;

    await connectDB();
    
    // Use the string id or let mongoose create one
    const docId = id && id.length === 24 ? id : undefined;
    const updateData = {
      player_id,
      nickname,
      mission_score,
      quiz_score,
      total_score,
      title,
      badge,
    };

    let result;
    if (docId) {
      result = await Result.findOneAndUpdate(
        { _id: docId },
        updateData,
        { upsert: true, new: true }
      ).lean();
    } else {
      result = await Result.create(updateData);
    }

    return NextResponse.json({
      data: {
        id: result._id.toString(),
        player_id: result.player_id,
        nickname: result.nickname,
        mission_score: result.mission_score,
        quiz_score: result.quiz_score,
        total_score: result.total_score,
        title: result.title,
        badge: result.badge,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
