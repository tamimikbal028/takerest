-- ==============================================================================
-- TAKE REST - CLEAN DATABASE BASELINE FOR SUPABASE
-- ==============================================================================
-- Core Foundation:
--   1. Extensions
--   2. Custom Enums
--   3. Users table (synced with Supabase auth.users)
--   4. Triggers (auto create public.users on signup, updated_at)
--   5. Row Level Security & Service Role Grants
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

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_user_name ON public.users (user_name);

-- 5. TRIGGERS & FUNCTIONS
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

-- Handle New User Signup from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
BEGIN
  base_username := lower(split_part(NEW.email, '@', 1));
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  IF char_length(base_username) < 3 THEN
    base_username := 'user_' || substr(md5(random()::text), 1, 6);
  END IF;
  
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.users WHERE user_name = final_username) LOOP
    final_username := base_username || floor(random() * 10000)::text;
  END LOOP;

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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.users TO service_role;

DROP POLICY IF EXISTS "Users can view public profile or self" ON public.users;
CREATE POLICY "Users can view public profile or self"
  ON public.users FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
