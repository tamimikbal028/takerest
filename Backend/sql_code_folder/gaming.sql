-- ========================================================
-- GAMING SCHEMA UPDATE: DYNAMIC DATABASE-DRIVEN GAME CATALOG
-- ========================================================

-- WARNING: The truncate statements below will delete all game records/profiles.
-- Uncomment them ONLY if you want to reset all gaming data for a clean slate.
-- TRUNCATE TABLE public.leaderboard_season_winners CASCADE;
-- TRUNCATE TABLE public.leaderboard_seasons CASCADE;
-- TRUNCATE TABLE public.arcade_scores CASCADE;
-- TRUNCATE TABLE public.gaming_profiles CASCADE;

-- 1. Create games table
CREATE TABLE IF NOT EXISTS public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE, -- e.g. 'math-sprint', 'grid-hunter', 'pattern-pulse'
  title text NOT NULL,
  description text,
  icon_url text,
  content_config jsonb NOT NULL DEFAULT '{}'::jsonb, -- Custom settings, levels, question pools, etc.
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Insert initial games seed data
INSERT INTO public.games (key, title, description, content_config) VALUES
('math-sprint', 'Math Sprint', 'Answer quick-fire math questions and bank clean points.', '{"total_questions": 25, "levels": 5, "questions_per_level": 5, "max_skips": 3, "max_mistakes": 3, "points_per_correct": 10, "penalty_per_wrong": 5}'::jsonb),
('grid-hunter', 'Grid Hunter', 'Scan the grid and find the smallest number as fast as you can.', '{"total_levels": 15, "easy_levels": 5, "medium_levels": 5, "hard_levels": 5, "penalty_per_wrong": 5}'::jsonb),
('speed-equate', 'Speed Equate', 'Tap numbers and operators to assemble a valid expression that equals the target.', '{"total_levels": 15, "easy_levels": 5, "medium_levels": 5, "hard_levels": 5, "max_skips": 3, "max_mistakes": 3, "points_per_correct": 10, "penalty_per_wrong": 5}'::jsonb),
('logical-deduction', 'Logical Deduction', 'Crack the hidden 4-digit code using green & yellow clues. Pure logic, no luck.', '{"total_levels": 10, "attempts_per_level": 10, "max_skips": 3, "max_mistakes": 3, "points_per_correct": 20, "penalty_per_wrong": 2, "time_limit": 100}'::jsonb),
('logic-path', 'Logic Path', 'Program a sequence of arrows to guide the character to the destination, avoiding obstacles.', '{"total_levels": 10, "easy_levels": 4, "medium_levels": 3, "hard_levels": 3, "points_per_correct": 20, "penalty_per_wrong": 5, "max_skips": 3, "max_mistakes": 3}'::jsonb),
('operator-grid', 'Operator Grid', 'Place operators in a 3x3 grid of numbers to satisfy the row and column targets.', '{"total_levels": 10, "easy_levels": 3, "medium_levels": 3, "hard_levels": 4, "points_per_correct": 20, "penalty_per_wrong": 5, "max_skips": 3, "max_mistakes": 3}'::jsonb),
('arithmetic-path', 'Arithmetic Path', 'Trace a continuous path from top-left to bottom-right that calculates to the target value.', '{"total_levels": 10, "easy_levels": 3, "medium_levels": 3, "hard_levels": 4, "points_per_correct": 20, "penalty_per_wrong": 5, "max_skips": 3, "max_mistakes": 3}'::jsonb),
('logical-deduction-2', 'Logical Deduction 2', 'Crack the secret 4-digit code using mathematical clues about the digits.', '{"total_levels": 10, "attempts_per_level": 5, "max_skips": 3, "max_mistakes": 3, "points_per_correct": 25, "penalty_per_wrong": 3, "time_limit": 120}'::jsonb),
('sum-matrix', 'Sum Matrix', 'Rearrange numbers in a grid to satisfy the row and column target sums.', '{"total_levels": 10, "easy_levels": 3, "medium_levels": 3, "hard_levels": 4, "points_per_correct": 20, "penalty_per_wrong": 5, "max_skips": 3, "max_mistakes": 3}'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_config = EXCLUDED.content_config;

-- Create custom enum type for game session status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_session_status') THEN
    CREATE TYPE public.game_session_status AS ENUM ('PLAYING', 'COMPLETED', 'EXPIRED');
  END IF;
END $$;

-- 3. Create game_sessions table
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gaming_profile_id uuid NOT NULL REFERENCES public.gaming_profiles(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  status public.game_session_status NOT NULL DEFAULT 'PLAYING'::public.game_session_status,
  session_state jsonb NOT NULL,           -- Backend generated questions/answers
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- 4. Alter public.arcade_scores to support game_id reference instead of game_key enum
-- Drop the old unique constraint
ALTER TABLE public.arcade_scores DROP CONSTRAINT IF EXISTS arcade_scores_profile_game_unique;

-- Add game_id column
ALTER TABLE public.arcade_scores ADD COLUMN IF NOT EXISTS game_id uuid REFERENCES public.games(id) ON DELETE CASCADE;

-- Drop obsolete game_key column
ALTER TABLE public.arcade_scores DROP COLUMN IF EXISTS game_key;

-- Recreate unique constraint with game_id (drop first if exists to avoid 'already exists' error)
ALTER TABLE public.arcade_scores DROP CONSTRAINT IF EXISTS arcade_scores_profile_game_id_unique;
ALTER TABLE public.arcade_scores ADD CONSTRAINT arcade_scores_profile_game_id_unique UNIQUE (gaming_profile_id, game_id);


-- 5. Alter public.leaderboard_season_winners to support game_id instead of game_key enum
-- Drop the old unique constraint
ALTER TABLE public.leaderboard_season_winners DROP CONSTRAINT IF EXISTS leaderboard_season_winners_unique;

-- Add game_id column
ALTER TABLE public.leaderboard_season_winners ADD COLUMN IF NOT EXISTS game_id uuid REFERENCES public.games(id) ON DELETE CASCADE;

-- Drop obsolete game_key column
ALTER TABLE public.leaderboard_season_winners DROP COLUMN IF EXISTS game_key;

-- Recreate unique constraint (drop first if exists to avoid 'already exists' error)
ALTER TABLE public.leaderboard_season_winners DROP CONSTRAINT IF EXISTS leaderboard_season_winners_unique;
ALTER TABLE public.leaderboard_season_winners ADD CONSTRAINT leaderboard_season_winners_unique UNIQUE (season_id, game_id, rank);


-- 6. Drop obsolete enum type
DROP TYPE IF EXISTS public.arcade_game_key;


-- 7. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- 8. Grant permissions
GRANT ALL ON public.games TO authenticated, anon;
GRANT ALL ON public.games TO service_role;
GRANT ALL ON public.game_sessions TO authenticated, anon;
GRANT ALL ON public.game_sessions TO service_role;
