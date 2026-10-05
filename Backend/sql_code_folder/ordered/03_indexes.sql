-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_user_name ON public.users (user_name);
CREATE INDEX IF NOT EXISTS idx_tracker_subjects_user ON public.tracker_subjects (user_id);
CREATE INDEX IF NOT EXISTS idx_tracker_sessions_user_date ON public.tracker_sessions (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracker_sessions_subject ON public.tracker_sessions (subject_id);
