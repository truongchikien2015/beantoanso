// GET /api/admin/results — list every FinalResult (admin only)
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { Result } from "@/lib/db/models/Result";

export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  await connectDB();

  const rows = await Result.find({} as any).sort({ completed_at: -1 } as any).lean();

  const data = rows.map((r: any) => ({
    id: String(r._id),
    player_id: r.player_id,
    nickname: r.nickname,
    mission_score: r.mission_score ?? 0,
    quiz_score: r.quiz_score ?? 0,
    total_score: r.total_score ?? 0,
    title: r.title ?? "",
    badge: r.badge ?? "",
    completed_at: r.completed_at,
  }));

  return NextResponse.json({ data });
}
