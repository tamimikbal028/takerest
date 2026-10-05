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
