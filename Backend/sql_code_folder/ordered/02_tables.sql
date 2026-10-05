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

-- 2. CATEGORIES / GROUPS TABLE (Deen, Academic, Others, etc.)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder',
  is_system_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ACTIVITIES TABLE (Items belonging to Category, e.g. Namaz, Talimuddin)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT NULL,
  icon TEXT DEFAULT 'activity',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TIME LOGS TABLE (Continuous 24h recorded segments)
CREATE TABLE IF NOT EXISTS public.time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
  is_wasted BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ACTIVE TIMER STATE TABLE (Continuous live timer)
CREATE TABLE IF NOT EXISTS public.active_timer (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Others',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_running BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
