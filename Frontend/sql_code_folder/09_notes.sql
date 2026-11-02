-- ==============================================================================
-- TAKE REST: 24-HOUR CONTINUOUS DAY TRACKER & LIFE OS
-- MIGRATION: 09_NOTES.SQL
-- NEW FEATURE:
--   Personal Notes, Interactive Checklists, Scratchpad & Ideas Keeper
-- ==============================================================================

-- 1. NOTES TABLE (notes)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  note_type TEXT NOT NULL DEFAULT 'TEXT' CHECK (note_type IN ('TEXT', 'CHECKLIST')),
  checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  color TEXT NOT NULL DEFAULT '#ffffff',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance Indexes for notes
CREATE INDEX IF NOT EXISTS idx_notes_user_pinned ON public.notes (user_id, is_pinned DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user_type ON public.notes (user_id, note_type);
CREATE INDEX IF NOT EXISTS idx_notes_user_archived ON public.notes (user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes (user_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
CREATE POLICY "Users can view their own notes"
  ON public.notes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notes" ON public.notes;
CREATE POLICY "Users can insert their own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
CREATE POLICY "Users can update their own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;
CREATE POLICY "Users can delete their own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Auto-update updated_at trigger for notes
DROP TRIGGER IF EXISTS trigger_notes_updated_at ON public.notes;
CREATE TRIGGER trigger_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Table Grants
GRANT ALL ON TABLE public.notes TO authenticated;
GRANT ALL ON TABLE public.notes TO service_role;
