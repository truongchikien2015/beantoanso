-- Migration: 023_teacher_content
-- Feature: 023-teacher-content
-- Date: 2026-05-17
-- Description: Creates tables for teacher content management: question sets, learning paths, students

BEGIN;

-- ============================================================
-- teacher_question_sets
-- Custom question sets created by individual teachers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_question_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 200 AND char_length(title) > 0),
  topic_id TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tqs_created_by ON public.teacher_question_sets(created_by);
CREATE INDEX IF NOT EXISTS idx_tqs_active ON public.teacher_question_sets(created_by, is_active) WHERE is_active = true;

-- ============================================================
-- teacher_questions
-- Individual questions within a teacher question set
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES public.teacher_question_sets(id) ON DELETE CASCADE,
  question TEXT NOT NULL CHECK (char_length(question) <= 1000 AND char_length(question) > 0),
  option_a TEXT NOT NULL CHECK (char_length(option_a) <= 500),
  option_b TEXT NOT NULL CHECK (char_length(option_b) <= 500),
  option_c TEXT NOT NULL CHECK (char_length(option_c) <= 500),
  correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C')),
  explanation TEXT CHECK (char_length(explanation) <= 500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tq_set_id ON public.teacher_questions(set_id);

-- ============================================================
-- teacher_learning_paths
-- Custom learning paths created by individual teachers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 200 AND char_length(title) > 0),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tlp_created_by ON public.teacher_learning_paths(created_by);
CREATE INDEX IF NOT EXISTS idx_tlp_active ON public.teacher_learning_paths(created_by, is_active) WHERE is_active = true;

-- ============================================================
-- teacher_learning_path_steps
-- Ordered steps within a learning path
-- Each step references either a topic or a teacher question set
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_learning_path_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES public.teacher_learning_paths(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL CHECK (step_order >= 1),
  step_type TEXT NOT NULL CHECK (step_type IN ('topic', 'question_set')),
  topic_id TEXT,
  question_set_id UUID REFERENCES public.teacher_question_sets(id),
  UNIQUE (path_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_tlps_path_id ON public.teacher_learning_path_steps(path_id);

-- ============================================================
-- teacher_students
-- Student accounts imported by teachers
-- Students authenticate with teacher-assigned code + password (bcrypt hash)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL CHECK (char_length(nickname) <= 100 AND char_length(nickname) > 0),
  email TEXT,
  class_name TEXT,
  student_code TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  assigned_path_id UUID REFERENCES public.teacher_learning_paths(id),
  assigned_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ts_created_by ON public.teacher_students(created_by);
CREATE INDEX IF NOT EXISTS idx_ts_student_code ON public.teacher_students(student_code);

-- ============================================================
-- teacher_student_progress
-- Per-step progress for students on their assigned learning path
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.teacher_students(id) ON DELETE CASCADE,
  path_id UUID NOT NULL REFERENCES public.teacher_learning_paths(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.teacher_learning_path_steps(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0 CHECK (score >= 0),
  completed_at TIMESTAMPTZ,
  UNIQUE (student_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_tsp_student_id ON public.teacher_student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_tsp_path_id ON public.teacher_student_progress(path_id);

-- ============================================================
-- Trigger: auto-update updated_at on mutable tables
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;

DROP TRIGGER IF EXISTS tqs_updated_at ON public.teacher_question_sets;
CREATE TRIGGER tqs_updated_at
  BEFORE UPDATE ON public.teacher_question_sets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tq_updated_at ON public.teacher_questions;
CREATE TRIGGER tq_updated_at
  BEFORE UPDATE ON public.teacher_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tlp_updated_at ON public.teacher_learning_paths;
CREATE TRIGGER tlp_updated_at
  BEFORE UPDATE ON public.teacher_learning_paths
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS ts_updated_at ON public.teacher_students;
CREATE TRIGGER ts_updated_at
  BEFORE UPDATE ON public.teacher_students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMIT;
