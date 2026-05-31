import { supabaseAdmin } from "@/lib/supabase-admin";

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
  if (!supabaseAdmin) return buildStudentStats(null);

  const { data } = await supabaseAdmin
    .from("teacher_student_stats")
    .select("student_id, total_xp, current_streak, longest_streak, last_daily_completed_on")
    .eq("student_id", studentId)
    .maybeSingle();

  if (data) return buildStudentStats(data as RawStats);

  const { data: created } = await supabaseAdmin
    .from("teacher_student_stats")
    .insert({ student_id: studentId })
    .select("student_id, total_xp, current_streak, longest_streak, last_daily_completed_on")
    .single();

  return buildStudentStats(created as RawStats | null);
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
  if (!supabaseAdmin) return buildStudentStats(null);

  const safeXp = Math.max(0, Math.floor(xp));
  await ensureStudentStats(studentId);

  if (safeXp > 0) {
    await supabaseAdmin
      .from("teacher_student_xp_events")
      .insert({ student_id: studentId, source, xp: safeXp, metadata });
  }

  const stats = await ensureStudentStats(studentId);
  const nextTotalXp = stats.total_xp + safeXp;

  const { data } = await supabaseAdmin
    .from("teacher_student_stats")
    .update({ total_xp: nextTotalXp })
    .eq("student_id", studentId)
    .select("student_id, total_xp, current_streak, longest_streak, last_daily_completed_on")
    .single();

  return buildStudentStats(data as RawStats | null);
}

export async function completeDailyStreak(studentId: string): Promise<StudentRewardStats> {
  if (!supabaseAdmin) return buildStudentStats(null);

  const today = toDateKey();
  const yesterday = yesterdayKey();
  const stats = await ensureStudentStats(studentId);

  if (stats.last_daily_completed_on === today) return stats;

  const nextStreak =
    stats.last_daily_completed_on === yesterday ? stats.current_streak + 1 : 1;
  const nextLongest = Math.max(stats.longest_streak, nextStreak);

  const { data } = await supabaseAdmin
    .from("teacher_student_stats")
    .update({
      current_streak: nextStreak,
      longest_streak: nextLongest,
      last_daily_completed_on: today,
    })
    .eq("student_id", studentId)
    .select("student_id, total_xp, current_streak, longest_streak, last_daily_completed_on")
    .single();

  return buildStudentStats(data as RawStats | null);
}

export function todayKey() {
  return toDateKey();
}
