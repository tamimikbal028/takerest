-- ==============================================================================
-- TAKE REST: 24-HOUR CONTINUOUS DAY TRACKER
-- MIGRATION: 10_GOALS.SQL
-- NEW FEATURES:
--   1. Daily Goals & Targets (Full Day, Time Range, and Multi-day Range)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACHIEVED', 'MISSED')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME WITHOUT TIME ZONE DEFAULT NULL,
  end_time TIME WITHOUT TIME ZONE DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_goals_user_dates
  ON public.daily_goals (user_id, start_date DESC, end_date DESC, sort_order ASC);

ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own daily goals" ON public.daily_goals;
CREATE POLICY "Users can manage own daily goals"
  ON public.daily_goals FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trigger_daily_goals_updated_at ON public.daily_goals;
CREATE TRIGGER trigger_daily_goals_updated_at
  BEFORE UPDATE ON public.daily_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT ALL ON TABLE public.daily_goals TO authenticated;
GRANT ALL ON TABLE public.daily_goals TO service_role;

