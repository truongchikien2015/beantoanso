-- Migration: 022_add_teachers_table
-- Feature: 022-teacher-accounts
-- Date: 2026-05-17
-- Description: Creates the teachers table for Supabase Auth-based teacher accounts

BEGIN;

-- ============================================================
-- teachers table
-- Stores teacher profiles linked to Supabase Auth (auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid UUID UNIQUE NOT NULL,        -- links to auth.users.id
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  school_id TEXT,                        -- reserved for future per-school filtering
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_teachers_email ON public.teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_auth_uid ON public.teachers(auth_uid);
CREATE INDEX IF NOT EXISTS idx_teachers_is_active ON public.teachers(is_active);

-- ============================================================
-- Row-Level Security
-- ============================================================
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Admin-only management (service role key bypasses this anyway)
CREATE POLICY "Manage teachers (admin)" ON public.teachers
  FOR ALL USING (true);

-- Public read for login lookup (email verification during sign-in)
CREATE POLICY "Read active teachers for auth" ON public.teachers
  FOR SELECT USING (is_active = true);

-- ============================================================
-- Trigger: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;

DROP TRIGGER IF EXISTS teachers_updated_at ON public.teachers;
CREATE TRIGGER teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMIT;

-- ============================================================
-- Note for Supabase Auth integration:
-- When creating a teacher:
--   1. supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })
--   2. Insert record into teachers with the returned user.id as auth_uid
--
-- When deactivating a teacher:
--   UPDATE teachers SET is_active = false WHERE id = <id>
--   supabaseAdmin.auth.admin.updateUserById(auth_uid, { disabled: true })
--
-- When deleting a teacher:
--   UPDATE teachers SET is_active = false WHERE id = <id>  -- soft delete
--   supabaseAdmin.auth.admin.updateUserById(auth_uid, { disabled: true })
--
-- When resetting password:
--   supabaseAdmin.auth.admin.updateUserById(auth_uid, { password: newPassword })
-- ============================================================
