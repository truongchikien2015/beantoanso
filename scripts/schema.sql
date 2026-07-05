-- ============================================================
-- Schema for "Be An Toan So" app
-- Run in Supabase SQL Editor or via migration
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TOPICS table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.topics (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT        NOT NULL UNIQUE,
  label       TEXT        NOT NULL,
  icon        TEXT        NOT NULL DEFAULT '📚',
  color       TEXT        NOT NULL DEFAULT 'indigo',
  topic_order INTEGER     NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- QUESTIONS table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.questions (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id       UUID        NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  question       TEXT        NOT NULL,
  option_a       TEXT        NOT NULL,
  option_b       TEXT        NOT NULL,
  option_c       TEXT        NOT NULL,
  correct_option TEXT        NOT NULL CHECK (correct_option IN ('A', 'B', 'C')),
  explanation    TEXT        NOT NULL DEFAULT '',
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RESULTS table (game completion records)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.results (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id      TEXT        NOT NULL,
  nickname       TEXT        NOT NULL,
  mission_score  INTEGER     NOT NULL DEFAULT 0,
  quiz_score     INTEGER     NOT NULL DEFAULT 0,
  total_score    INTEGER     NOT NULL DEFAULT 0,
  title          TEXT        NOT NULL DEFAULT '',
  badge          TEXT        NOT NULL DEFAULT '',
  completed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STUDENT ANSWERS table (answer history)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_answers (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id       TEXT        NOT NULL,
  nickname        TEXT        NOT NULL,
  topic_slug      TEXT        NOT NULL,
  topic_label     TEXT        NOT NULL,
  selected_option TEXT        NOT NULL CHECK (selected_option IN ('A', 'B', 'C')),
  correct_option  TEXT        NOT NULL CHECK (correct_option IN ('A', 'B', 'C')),
  is_correct      BOOLEAN     NOT NULL DEFAULT false,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LEARNING PATHS table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  topic_ids   TEXT[]      NOT NULL DEFAULT '{}',
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_is_active  ON public.questions(is_active);
CREATE INDEX IF NOT EXISTS idx_results_player_id   ON public.results(player_id);
CREATE INDEX IF NOT EXISTS idx_results_completed   ON public.results(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_player     ON public.student_answers(player_id);
CREATE INDEX IF NOT EXISTS idx_answers_timestamp  ON public.student_answers(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_topics_is_active    ON public.topics(is_active);
CREATE INDEX IF NOT EXISTS idx_paths_is_active     ON public.learning_paths(is_active);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — allow all for anon key
-- ============================================================
ALTER TABLE public.topics         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

-- Public read/write policies
CREATE POLICY "Allow all on topics"         ON public.topics         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on questions"     ON public.questions      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on results"       ON public.results        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on student_answers" ON public.student_answers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on learning_paths" ON public.learning_paths FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- PROFILES table (for authenticated users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT        NOT NULL DEFAULT '',
  gender      TEXT        NOT NULL DEFAULT '',
  birth_year  INTEGER     NOT NULL DEFAULT 2010,
  xp          INTEGER     NOT NULL DEFAULT 0,
  level       INTEGER     NOT NULL DEFAULT 1,
  total_score INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USER PROGRESS table (optional, for tracking daily challenges/paths)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  path_id     UUID        REFERENCES public.learning_paths(id) ON DELETE SET NULL,
  status      TEXT        NOT NULL DEFAULT 'in_progress',
  progress    INTEGER     NOT NULL DEFAULT 0,
  last_played TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on user_progress" ON public.user_progress FOR ALL USING (true) WITH CHECK (true);
