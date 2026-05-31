-- ============================================================
-- Migration 028: Reward tables that work for ANY student type
-- (teacher-created students AND self-registered Supabase Auth students)
--
-- Fixes runtime error:
--   "Could not find the table 'public.teacher_student_daily_attempts'
--    in the schema cache"
--
-- This is idempotent: safe to run even if 026 already ran. It creates the
-- reward tables if missing and removes the teacher_students foreign keys so
-- self-registered student ids (from auth.users / profiles) can be stored too.
-- ============================================================

BEGIN;

-- Shared updated_at trigger function (no-op if it already exists)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── Lifetime stats / streak ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.teacher_student_stats (
  student_id UUID PRIMARY KEY,
  total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_daily_completed_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── XP events log ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.teacher_student_xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('daily_quiz', 'step_quiz', 'topic_complete')),
  xp INTEGER NOT NULL CHECK (xp >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Daily quiz attempts ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.teacher_student_daily_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  attempt_date DATE NOT NULL,
  question_ids UUID[] NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  xp_awarded INTEGER NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, attempt_date)
);

-- If 026 already created these tables WITH the teacher_students FK, drop it so
-- self-registered students (not in teacher_students) can be stored.
ALTER TABLE public.teacher_student_stats
  DROP CONSTRAINT IF EXISTS teacher_student_stats_student_id_fkey;
ALTER TABLE public.teacher_student_xp_events
  DROP CONSTRAINT IF EXISTS teacher_student_xp_events_student_id_fkey;
ALTER TABLE public.teacher_student_daily_attempts
  DROP CONSTRAINT IF EXISTS teacher_student_daily_attempts_student_id_fkey;

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tss_total_xp ON public.teacher_student_stats(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_tsxe_student_id ON public.teacher_student_xp_events(student_id);
CREATE INDEX IF NOT EXISTS idx_tsxe_created_at ON public.teacher_student_xp_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tsda_student_date ON public.teacher_student_daily_attempts(student_id, attempt_date DESC);

-- ── updated_at trigger on stats ──────────────────────────────────────────────
DROP TRIGGER IF EXISTS tss_updated_at ON public.teacher_student_stats;
CREATE TRIGGER tss_updated_at
  BEFORE UPDATE ON public.teacher_student_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── Row-Level Security: service role full access ─────────────────────────────
ALTER TABLE public.teacher_student_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_student_xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_student_daily_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_full_access_tss" ON public.teacher_student_stats;
CREATE POLICY "service_full_access_tss" ON public.teacher_student_stats
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_full_access_tsxe" ON public.teacher_student_xp_events;
CREATE POLICY "service_full_access_tsxe" ON public.teacher_student_xp_events
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_full_access_tsda" ON public.teacher_student_daily_attempts;
CREATE POLICY "service_full_access_tsda" ON public.teacher_student_daily_attempts
  FOR ALL USING (true) WITH CHECK (true);

COMMIT;

-- After running, Supabase auto-reloads the schema cache. If the
-- "schema cache" error persists, run:  NOTIFY pgrst, 'reload schema';
