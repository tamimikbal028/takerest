-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_preferences ENABLE ROW LEVEL SECURITY;

-- 1. Users policies
DROP POLICY IF EXISTS "Users can view public profile or self" ON public.users;
CREATE POLICY "Users can view public profile or self"
  ON public.users FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Tracker Subjects policies
DROP POLICY IF EXISTS "Users can manage own subjects" ON public.tracker_subjects;
CREATE POLICY "Users can manage own subjects"
  ON public.tracker_subjects FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Tracker Sessions policies
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.tracker_sessions;
CREATE POLICY "Users can manage own sessions"
  ON public.tracker_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Tracker Preferences policies
DROP POLICY IF EXISTS "Users can manage own tracker preferences" ON public.tracker_preferences;
CREATE POLICY "Users can manage own tracker preferences"
  ON public.tracker_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
