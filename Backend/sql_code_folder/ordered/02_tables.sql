-- 1. CORE USERS TABLE (Linked to auth.users)
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

-- 2. TRACKER SUBJECTS TABLE (User's subjects / topics)
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

-- 3. TRACKER SESSIONS LOG TABLE (Study and Break tracking)
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

-- 4. TRACKER PREFERENCES TABLE (Timer defaults and daily goal)
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
