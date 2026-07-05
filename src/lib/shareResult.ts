import {
  getSiteUrl,
  shareResultFromSearchParams,
  type ShareResult,
} from "./shareResultQuery";

export { getSiteUrl, shareResultFromSearchParams };
export type { ShareResult };

export async function getShareResult(
  id: string,
  searchParams: Record<string, string | string[] | undefined> = {},
): Promise<ShareResult> {
  const fallback = shareResultFromSearchParams(id, searchParams);

  // 1. Try to find in MongoDB Results first
  try {
    const { connectDB } = await import("./mongodb");
    await connectDB();
    const { Result } = await import("./db/models/Result");
    const mongoose = await import("mongoose");

    let queryObj = {};
    if (mongoose.default.Types.ObjectId.isValid(id)) {
      queryObj = { _id: id };
    } else {
      queryObj = { player_id: id };
    }

    const dbResult = await Result.findOne(queryObj).lean();
    if (dbResult) {
      return {
        id: dbResult._id.toString(),
        nickname: dbResult.nickname,
        mission_score: dbResult.mission_score,
        quiz_score: dbResult.quiz_score,
        total_score: dbResult.total_score,
        title: dbResult.title,
        badge: dbResult.badge,
        completed_at: dbResult.completed_at ? new Date(dbResult.completed_at).toISOString() : undefined,
      };
    }
  } catch (err) {
    console.error("MongoDB share result fetch error:", err);
  }

  return fallback;
}
