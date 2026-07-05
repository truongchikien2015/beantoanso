// GET /api/admin/student-answers — list every StudentAnswer (admin only)
// Supports ?playerId=... to fetch a single player's answer history.
// Returns camelCase to match the shape used by AdminDashboard's StudentModal.
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/mongodb";
import { StudentAnswer } from "@/lib/db/models/StudentAnswer";

export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  await connectDB();

  const playerId = req.nextUrl.searchParams.get("playerId");
  const filter = playerId ? { player_id: playerId } : {};

  const rows = await StudentAnswer.find(filter as any)
    .sort({ timestamp: -1 } as any)
    .lean();

  const data = rows.map((a: any) => ({
    id: String(a._id),
    playerId: a.player_id,
    nickname: a.nickname,
    topicSlug: a.topic_slug,
    topicLabel: a.topic_label,
    selectedOption: a.selected_option,
    correctOption: a.correct_option,
    isCorrect: !!a.is_correct,
    timestamp: a.timestamp,
  }));

  return NextResponse.json({ data });
}
