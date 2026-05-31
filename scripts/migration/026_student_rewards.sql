-- ============================================================
-- Feature 026: Student lifetime XP, daily streaks, and rewards
-- ============================================================

CREATE TABLE IF NOT EXISTS public.teacher_student_stats (
  student_id UUID PRIMARY KEY REFERENCES public.teacher_students(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_daily_completed_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teacher_student_xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.teacher_students(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('daily_quiz', 'step_quiz', 'topic_complete')),
  xp INTEGER NOT NULL CHECK (xp >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teacher_student_daily_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.teacher_students(id) ON DELETE CASCADE,
  attempt_date DATE NOT NULL,
  question_ids UUID[] NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  xp_awarded INTEGER NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, attempt_date)
);

CREATE INDEX IF NOT EXISTS idx_tss_total_xp ON public.teacher_student_stats(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_tsxe_student_id ON public.teacher_student_xp_events(student_id);
CREATE INDEX IF NOT EXISTS idx_tsxe_created_at ON public.teacher_student_xp_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tsda_student_date ON public.teacher_student_daily_attempts(student_id, attempt_date DESC);

DROP TRIGGER IF EXISTS tss_updated_at ON public.teacher_student_stats;
CREATE TRIGGER tss_updated_at
  BEFORE UPDATE ON public.teacher_student_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.teacher_student_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_student_xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_student_daily_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_full_access_tss" ON public.teacher_student_stats
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_full_access_tsxe" ON public.teacher_student_xp_events
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_full_access_tsda" ON public.teacher_student_daily_attempts
  FOR ALL USING (true) WITH CHECK (true);
