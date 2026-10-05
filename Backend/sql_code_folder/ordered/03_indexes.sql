CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_user_name ON public.users (user_name);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories (user_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON public.activities (category_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON public.activities (user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_date ON public.time_logs (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_logs_category ON public.time_logs (category_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_is_wasted ON public.time_logs (user_id, is_wasted);
