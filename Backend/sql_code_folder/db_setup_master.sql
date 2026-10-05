-- ==============================================================================
-- TAKE REST: 24-HOUR CONTINUOUS DAY TRACKER
-- COMPLETE DATABASE SCHEMA FOR FRESH SUPABASE PROJECT
-- ==============================================================================
-- Features supported:
--   1. Categories / Groups (e.g., Deen, Academic, Others)
--   2. Activities under categories (e.g., Namaz, Talimuddin, Courses)
--   3. Time Logs (Continuous day tracking with start_time, end_time, is_wasted)
--   4. Active Timer State (Continuous live timer surviving browser reloads)
--   5. Starter Defaults (Deen, Academic, Others automatically provisioned)
--   6. Indexes, Triggers, Row Level Security (RLS) & Service Role Grants
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

-- 4. CATEGORIES / GROUPS TABLE (Deen, Academic, Others, etc.)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6', -- Hex color for 24h timeline visualization
  icon TEXT DEFAULT 'folder',
  is_system_default BOOLEAN NOT NULL DEFAULT false, -- True for default 'Others' group
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ACTIVITIES TABLE (Items belonging to a Category, e.g. Namaz, Talimuddin under Deen)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT NULL, -- Optional item-specific color (or inherits category color)
  icon TEXT DEFAULT 'activity',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TIME LOGS TABLE (Continuous 24-hour recorded segments)
CREATE TABLE IF NOT EXISTS public.time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,                         -- Activity name or custom title (e.g. 'Talimuddin', 'Gosol', 'Rest')
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
  is_wasted BOOLEAN NOT NULL DEFAULT false,    -- User flag: Mark as Wasted Time
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ACTIVE TIMER STATE TABLE (Stores currently running segment so refreshes/closing never lose time)
CREATE TABLE IF NOT EXISTS public.active_timer (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Others',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_running BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_user_name ON public.users (user_name);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories (user_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON public.activities (category_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON public.activities (user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_date ON public.time_logs (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_logs_category ON public.time_logs (category_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_is_wasted ON public.time_logs (user_id, is_wasted);

-- 9. TRIGGERS & FUNCTIONS
-- 9.1 Auto-update updated_at timestamp
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

DROP TRIGGER IF EXISTS trigger_categories_updated_at ON public.categories;
CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_activities_updated_at ON public.activities;
CREATE TRIGGER trigger_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_active_timer_updated_at ON public.active_timer;
CREATE TRIGGER trigger_active_timer_updated_at
  BEFORE UPDATE ON public.active_timer
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9.2 Handle New User Signup from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  deen_cat_id UUID;
  academic_cat_id UUID;
  others_cat_id UUID;
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

  -- 2. Insert Default Categories (Groups)
  INSERT INTO public.categories (user_id, name, color, icon, sort_order)
  VALUES (NEW.id, 'Deen', '#10B981', 'moon', 1)
  RETURNING id INTO deen_cat_id;

  INSERT INTO public.categories (user_id, name, color, icon, sort_order)
  VALUES (NEW.id, 'Academic', '#3B82F6', 'book-open', 2)
  RETURNING id INTO academic_cat_id;

  INSERT INTO public.categories (user_id, name, color, icon, is_system_default, sort_order)
  VALUES (NEW.id, 'Others', '#64748B', 'clock', 99)
  RETURNING id INTO others_cat_id;

  -- 3. Insert Starter Activities under Deen & Academic
  INSERT INTO public.activities (user_id, category_id, name, icon, sort_order)
  VALUES 
    (NEW.id, deen_cat_id, 'Namaz', 'heart', 1),
    (NEW.id, deen_cat_id, 'Talimuddin', 'bookmark', 2);

  INSERT INTO public.activities (user_id, category_id, name, icon, sort_order)
  VALUES 
    (NEW.id, academic_cat_id, 'Course Study', 'code', 1);

  -- 4. Initialize Active Timer in 'Others' mode
  INSERT INTO public.active_timer (user_id, category_id, title, started_at, is_running)
  VALUES (NEW.id, others_cat_id, 'Others', now(), true)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger on auth.users for signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_timer ENABLE ROW LEVEL SECURITY;

-- Service Role full access (Backend API bypasses RLS using service role key)
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON TABLE public.categories TO service_role;
GRANT ALL ON TABLE public.activities TO service_role;
GRANT ALL ON TABLE public.time_logs TO service_role;
GRANT ALL ON TABLE public.active_timer TO service_role;

-- Authenticated Users Policies (User can only read/write their own data)
DROP POLICY IF EXISTS "Users can view public profile or self" ON public.users;
CREATE POLICY "Users can view public profile or self"
  ON public.users FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
CREATE POLICY "Users can manage own categories"
  ON public.categories FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own activities" ON public.activities;
CREATE POLICY "Users can manage own activities"
  ON public.activities FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own time logs" ON public.time_logs;
CREATE POLICY "Users can manage own time logs"
  ON public.time_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own active timer" ON public.active_timer;
CREATE POLICY "Users can manage own active timer"
  ON public.active_timer FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
