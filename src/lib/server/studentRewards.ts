import { connectDB } from "@/lib/mongodb";
import { TeacherStudentStats } from "@/lib/db/models/TeacherStudentStats";
import { TeacherXpEvent } from "@/lib/db/models/TeacherXpEvent";

export type StudentRewardStats = {
  total_xp: number;
  level: number;
  xp_in_level: number;
  xp_for_next: number;
  current_streak: number;
  longest_streak: number;
  last_daily_completed_on: string | null;
};

export type XpSource = "daily_quiz" | "step_quiz" | "topic_complete";

type RawStats = {
  student_id: string;
  total_xp: number | null;
  current_streak: number | null;
  longest_streak: number | null;
  last_daily_completed_on: string | null;
};

export const XP_PER_CORRECT_ANSWER = 10;
export const XP_TOPIC_COMPLETE = 10;
export const DAILY_QUESTION_COUNT = 5;

function toDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function yesterdayKey(date = new Date()) {
  return new Date(date.getTime() - 86400000).toISOString().slice(0, 10);
}

export function buildStudentStats(raw?: RawStats | null): StudentRewardStats {
  const totalXp = Math.max(0, raw?.total_xp ?? 0);
  const level = Math.floor(totalXp / 100) + 1;
  return {
    total_xp: totalXp,
    level,
    xp_in_level: totalXp - (level - 1) * 100,
    xp_for_next: 100,
    current_streak: Math.max(0, raw?.current_streak ?? 0),
    longest_streak: Math.max(0, raw?.longest_streak ?? 0),
    last_daily_completed_on: raw?.last_daily_completed_on ?? null,
  };
}

export async function ensureStudentStats(studentId: string): Promise<StudentRewardStats> {
  await connectDB();

  const data = await TeacherStudentStats.findOne({ student_id: studentId }).lean();

  if (data) return buildStudentStats(data as unknown as RawStats);

  const created = await TeacherStudentStats.create({ student_id: studentId });

  return buildStudentStats(created.toObject() as unknown as RawStats);
}

export async function awardStudentXp({
  studentId,
  source,
  xp,
  metadata = {},
}: {
  studentId: string;
  source: XpSource;
  xp: number;
  metadata?: Record<string, unknown>;
}): Promise<StudentRewardStats> {
  await connectDB();

  const safeXp = Math.max(0, Math.floor(xp));
  await ensureStudentStats(studentId);

  if (safeXp > 0) {
    await TeacherXpEvent.create({ student_id: studentId, source, xp: safeXp, metadata });
  }

  const stats = await ensureStudentStats(studentId);
  const nextTotalXp = stats.total_xp + safeXp;

  const updated = await TeacherStudentStats.findOneAndUpdate(
    { student_id: studentId },
    { total_xp: nextTotalXp },
    { new: true }
  ).lean();

  return buildStudentStats(updated as unknown as RawStats);
}

export async function completeDailyStreak(studentId: string): Promise<StudentRewardStats> {
  await connectDB();

  const today = toDateKey();
  const yesterday = yesterdayKey();
  const stats = await ensureStudentStats(studentId);

  if (stats.last_daily_completed_on === today) return stats;

  const nextStreak =
    stats.last_daily_completed_on === yesterday ? stats.current_streak + 1 : 1;
  const nextLongest = Math.max(stats.longest_streak, nextStreak);

  const updated = await TeacherStudentStats.findOneAndUpdate(
    { student_id: studentId },
    {
      current_streak: nextStreak,
      longest_streak: nextLongest,
      last_daily_completed_on: today,
    },
    { new: true }
  ).lean();

  return buildStudentStats(updated as unknown as RawStats);
}

export function todayKey() {
  return toDateKey();
}
