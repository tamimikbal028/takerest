-- ==============================================================================
-- TAKE REST (Study & Rest/Break Tracker Platform)
-- COMPLETE DATABASE SCHEMA FOR FRESH SUPABASE PROJECT
-- ==============================================================================
-- Run this entire script in Supabase SQL Editor for your new project.
-- It sets up:
--   1. Necessary Extensions & Types
--   2. Users table (linked to Supabase auth.users)
--   3. Tracker Subjects table (with colors, icons, weekly target hours)
--   4. Tracker Sessions table (study & rest session logs, focus ratings, notes)
--   5. Tracker Preferences table (daily goal, pomodoro work/break durations, sounds)
--   6. Indexes for high performance
--   7. Triggers for updated_at and auto-provisioning new user defaults on signup
--   8. Row Level Security (RLS) policies and service_role permissions
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. CUSTOM TYPES & ENUMS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE public.account_status AS ENUM ('ACTIVE', 'DELETED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
    CREATE TYPE public.user_type AS ENUM ('ADMIN', 'MODERATOR', 'TEACHER', 'STUDENT');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'education_level') THEN
    CREATE TYPE public.education_level AS ENUM ('UNIVERSITY', 'K12');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender') THEN
    CREATE TYPE public.gender AS ENUM ('MALE', 'FEMALE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'religion') THEN
    CREATE TYPE public.religion AS ENUM ('Islam', 'Hindu', 'Christian', 'Others');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tracker_session_type') THEN
    CREATE TYPE public.tracker_session_type AS ENUM ('STUDY', 'REST', 'POMODORO');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. CORE USERS TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  user_name TEXT NOT NULL UNIQUE CHECK (user_name ~* '^[a-z0-9_.]+$'),
  phone_number TEXT DEFAULT NULL,
  avatar TEXT DEFAULT NULL,
  cover_image TEXT DEFAULT NULL,
  bio TEXT CHECK (char_length(bio) <= 300),
  gender public.gender DEFAULT NULL,
  religion public.religion DEFAULT NULL,
  user_type public.user_type NOT NULL DEFAULT 'STUDENT',
  education_level public.education_level NOT NULL DEFAULT 'K12',
  account_status public.account_status NOT NULL DEFAULT 'ACTIVE',
  is_institutional_email BOOLEAN NOT NULL DEFAULT false,
  password_changed_at TIMESTAMPTZ DEFAULT NULL,
  agree_to_terms BOOLEAN NOT NULL DEFAULT true,
  terms_agreed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_post_blocked BOOLEAN NOT NULL DEFAULT false,
  is_comment_blocked BOOLEAN NOT NULL DEFAULT false,
  is_message_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TRACKER SUBJECTS TABLE (User's subjects / topics)
CREATE TABLE IF NOT EXISTS public.tracker_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'book',
  target_hours_per_week NUMERIC(5, 2) NOT NULL DEFAULT 5.00 CHECK (target_hours_per_week >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TRACKER SESSIONS LOG TABLE (Study and Break tracking)
CREATE TABLE IF NOT EXISTS public.tracker_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.tracker_subjects(id) ON DELETE SET NULL,
  session_type public.tracker_session_type NOT NULL DEFAULT 'STUDY',
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  rest_duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (rest_duration_seconds >= 0),
  focus_rating INTEGER CHECK (focus_rating IS NULL OR (focus_rating >= 1 AND focus_rating <= 5)),
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TRACKER PREFERENCES TABLE (Timer defaults and daily goal)
CREATE TABLE IF NOT EXISTS public.tracker_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  daily_goal_minutes INTEGER NOT NULL DEFAULT 180 CHECK (daily_goal_minutes > 0),
  pomodoro_work_minutes INTEGER NOT NULL DEFAULT 25 CHECK (pomodoro_work_minutes > 0),
  pomodoro_break_minutes INTEGER NOT NULL DEFAULT 5 CHECK (pomodoro_break_minutes > 0),
  long_break_minutes INTEGER NOT NULL DEFAULT 15 CHECK (long_break_minutes > 0),
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  ambient_sound TEXT DEFAULT 'none',
  auto_start_breaks BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_user_name ON public.users (user_name);
CREATE INDEX IF NOT EXISTS idx_tracker_subjects_user ON public.tracker_subjects (user_id);
CREATE INDEX IF NOT EXISTS idx_tracker_sessions_user_date ON public.tracker_sessions (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracker_sessions_subject ON public.tracker_sessions (subject_id);

-- 8. TRIGGERS & FUNCTIONS
-- 8.1 Auto update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_tracker_subjects_updated_at ON public.tracker_subjects;
CREATE TRIGGER trigger_tracker_subjects_updated_at
  BEFORE UPDATE ON public.tracker_subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_tracker_preferences_updated_at ON public.tracker_preferences;
CREATE TRIGGER trigger_tracker_preferences_updated_at
  BEFORE UPDATE ON public.tracker_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8.2 Handle New User Signup from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
BEGIN
  -- Generate unique username from email
  base_username := lower(split_part(NEW.email, '@', 1));
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  IF char_length(base_username) < 3 THEN
    base_username := 'user_' || substr(md5(random()::text), 1, 6);
  END IF;
  
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.users WHERE user_name = final_username) LOOP
    final_username := base_username || floor(random() * 10000)::text;
  END LOOP;

  -- 1. Insert into public.users
  INSERT INTO public.users (
    id,
    full_name,
    email,
    user_name,
    user_type,
    education_level,
    agree_to_terms
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    final_username,
    COALESCE((NEW.raw_user_meta_data->>'user_type')::public.user_type, 'STUDENT'),
    COALESCE((NEW.raw_user_meta_data->>'education_level')::public.education_level, 'K12'),
    COALESCE((NEW.raw_user_meta_data->>'agree_to_terms')::boolean, true)
  );

  -- 2. Insert default tracker preferences
  INSERT INTO public.tracker_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Insert starter subjects for instant user delight
  INSERT INTO public.tracker_subjects (user_id, name, color, icon, target_hours_per_week)
  VALUES 
    (NEW.id, 'Deep Work & Study', '#3B82F6', 'book-open', 8.00),
    (NEW.id, 'Mathematics & Problem Solving', '#10B981', 'calculator', 5.00),
    (NEW.id, 'Reading & Research', '#8B5CF6', 'bookmark', 4.00)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger on auth.users for signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_preferences ENABLE ROW LEVEL SECURITY;

-- Service Role full access (Backend bypasses RLS using service role key)
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON TABLE public.tracker_subjects TO service_role;
GRANT ALL ON TABLE public.tracker_sessions TO service_role;
GRANT ALL ON TABLE public.tracker_preferences TO service_role;

-- Authenticated Users Policies (Direct client access if needed)
DROP POLICY IF EXISTS "Users can view public profile or self" ON public.users;
CREATE POLICY "Users can view public profile or self"
  ON public.users FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage own subjects" ON public.tracker_subjects;
CREATE POLICY "Users can manage own subjects"
  ON public.tracker_subjects FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own sessions" ON public.tracker_sessions;
CREATE POLICY "Users can manage own sessions"
  ON public.tracker_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own tracker preferences" ON public.tracker_preferences;
CREATE POLICY "Users can manage own tracker preferences"
  ON public.tracker_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
