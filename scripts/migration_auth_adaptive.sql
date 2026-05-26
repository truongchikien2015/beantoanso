-- ============================================================
-- Migration: Auth, Adaptive Questioning & User Progress
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add adaptive columns to questions
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS min_age INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_age INTEGER DEFAULT 99,
ADD COLUMN IF NOT EXISTS target_gender TEXT DEFAULT 'all' CHECK (target_gender IN ('male', 'female', 'all'));

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  gender      TEXT        CHECK (gender IN ('male', 'female', 'other')),
  birth_year  INTEGER,
  avatar_url  TEXT,
  xp          INTEGER     NOT NULL DEFAULT 0,
  level       INTEGER     NOT NULL DEFAULT 1,
  total_score INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active_path_id    UUID        REFERENCES public.learning_paths(id),
  completed_topics  JSONB       NOT NULL DEFAULT '[]',
  daily_challenges  JSONB       NOT NULL DEFAULT '{}',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable RLS and Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User Progress Policies
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);
