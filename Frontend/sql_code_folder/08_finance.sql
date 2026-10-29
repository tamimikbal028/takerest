-- ==============================================================================
-- TAKE REST: 24-HOUR CONTINUOUS DAY TRACKER
-- MIGRATION: 08_FINANCE.SQL
-- NEW FEATURES:
--   1. Money Tracker (Daily Expense, Categories & Payment Methods)
-- ==============================================================================

-- 1. MONEY TRACKER TABLE (finance_transactions)
CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  type TEXT NOT NULL CHECK (type IN ('EXPENSE', 'INCOME')),
  category TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME WITHOUT TIME ZONE DEFAULT CURRENT_TIME,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance Indexes for finance_transactions
CREATE INDEX IF NOT EXISTS idx_finance_user_date ON public.finance_transactions (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_user_type ON public.finance_transactions (user_id, type);
CREATE INDEX IF NOT EXISTS idx_finance_category ON public.finance_transactions (user_id, category);

-- Enable RLS for finance_transactions
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own finance transactions" ON public.finance_transactions;
CREATE POLICY "Users can view their own finance transactions"
  ON public.finance_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own finance transactions" ON public.finance_transactions;
CREATE POLICY "Users can insert their own finance transactions"
  ON public.finance_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own finance transactions" ON public.finance_transactions;
CREATE POLICY "Users can update their own finance transactions"
  ON public.finance_transactions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own finance transactions" ON public.finance_transactions;
CREATE POLICY "Users can delete their own finance transactions"
  ON public.finance_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at trigger for finance_transactions
DROP TRIGGER IF EXISTS trigger_finance_transactions_updated_at ON public.finance_transactions;
CREATE TRIGGER trigger_finance_transactions_updated_at
  BEFORE UPDATE ON public.finance_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Table Grants
GRANT ALL ON TABLE public.finance_transactions TO authenticated;
GRANT ALL ON TABLE public.finance_transactions TO service_role;


