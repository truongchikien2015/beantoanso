-- Migration: 025_teacher_topics
-- Feature: Teacher can add custom topics
-- Date: 2026-05-17
-- Description: Allows teachers to create custom topics for their question sets

BEGIN;

-- ============================================================
-- teacher_topics
-- Custom topics created by individual teachers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_key TEXT NOT NULL CHECK (char_length(topic_key) <= 50 AND char_length(topic_key) > 0),
  label TEXT NOT NULL CHECK (char_length(label) <= 100 AND char_length(label) > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (created_by, topic_key)
);

CREATE INDEX IF NOT EXISTS idx_tt_created_by ON public.teacher_topics(created_by);
CREATE INDEX IF NOT EXISTS idx_tt_active ON public.teacher_topics(created_by, is_active) WHERE is_active = true;

-- ============================================================
-- Trigger: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_teacher_topic_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;

DROP TRIGGER IF EXISTS tt_updated_at ON public.teacher_topics;
CREATE TRIGGER tt_updated_at
  BEFORE UPDATE ON public.teacher_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_teacher_topic_updated_at();

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE public.teacher_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their own topics"
  ON public.teacher_topics
  FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

COMMIT;
