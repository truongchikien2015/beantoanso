-- Migration: 024_teacher_rls
-- Feature: 023-teacher-content
-- Date: 2026-05-17
-- Description: RLS policies + topic_id FK fix for teacher content tables
-- NOTE: Run AFTER 023_teacher_content.sql. Tables already exist.

BEGIN;

-- Fix topic_id columns: drop any broken FK, ensure TEXT type
ALTER TABLE IF EXISTS public.teacher_question_sets
  DROP CONSTRAINT IF EXISTS teacher_question_sets_topic_id_fkey,
  ALTER COLUMN topic_id TYPE TEXT USING topic_id::TEXT;

ALTER TABLE IF EXISTS public.teacher_learning_path_steps
  DROP CONSTRAINT IF EXISTS teacher_learning_path_steps_topic_id_fkey,
  ALTER COLUMN topic_id TYPE TEXT USING topic_id::TEXT;

-- ============================================================
-- Enable RLS on all teacher content tables
-- ============================================================
ALTER TABLE IF EXISTS public.teacher_question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher_learning_path_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher_student_progress ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies
-- All policies grant full access to the service_role (bypass RLS).
-- The API routes use supabaseAdmin (service_role), so no auth.uid() checks needed.
-- ============================================================

-- teacher_question_sets: service role full access
DROP POLICY IF EXISTS "service_full_access_tqs" ON public.teacher_question_sets;
CREATE POLICY "service_full_access_tqs" ON public.teacher_question_sets
  FOR ALL USING (true) WITH CHECK (true);

-- teacher_questions: service role full access
DROP POLICY IF EXISTS "service_full_access_tq" ON public.teacher_questions;
CREATE POLICY "service_full_access_tq" ON public.teacher_questions
  FOR ALL USING (true) WITH CHECK (true);

-- teacher_learning_paths: service role full access
DROP POLICY IF EXISTS "service_full_access_tlp" ON public.teacher_learning_paths;
CREATE POLICY "service_full_access_tlp" ON public.teacher_learning_paths
  FOR ALL USING (true) WITH CHECK (true);

-- teacher_learning_path_steps: service role full access
DROP POLICY IF EXISTS "service_full_access_tlps" ON public.teacher_learning_path_steps;
CREATE POLICY "service_full_access_tlps" ON public.teacher_learning_path_steps
  FOR ALL USING (true) WITH CHECK (true);

-- teacher_students: service role full access
DROP POLICY IF EXISTS "service_full_access_ts" ON public.teacher_students;
CREATE POLICY "service_full_access_ts" ON public.teacher_students
  FOR ALL USING (true) WITH CHECK (true);

-- teacher_student_progress: service role full access
DROP POLICY IF EXISTS "service_full_access_tsp" ON public.teacher_student_progress;
CREATE POLICY "service_full_access_tsp" ON public.teacher_student_progress
  FOR ALL USING (true) WITH CHECK (true);

COMMIT;
