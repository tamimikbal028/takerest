-- ============================================================================
-- SQL Script: Weekly Leaderboard Rewards (TESTING MODE - Runs every 5 minutes)
-- ============================================================================
--
-- Instructions:
-- Run this script in the Supabase SQL Editor.
-- It will configure the active 'weekly-leaderboard-rewards-job' to run every 5 minutes.
-- Award is set to 1 XP for testing purposes.
-- Time checks are bypassed to run immediately.
--
-- After testing, tell the AI to restore the production settings.
-- ============================================================================

-- 1. Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create the reward processing function
CREATE OR REPLACE FUNCTION public.process_weekly_rewards()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_friday date;
  new_season_id uuid;
  winner RECORD;
  distributed boolean;
  game_rec RECORD;
  rank1_id uuid;
  rank2_id uuid;
  rank3_id uuid;
  winners_json jsonb := '[]'::jsonb;
BEGIN
  -- Determine current Friday ending date (Asia/Dhaka timezone)
  current_friday := ((now() AT TIME ZONE 'Asia/Dhaka') - ((EXTRACT(dow FROM (now() AT TIME ZONE 'Asia/Dhaka'))::int + 2) % 7 || ' days')::interval)::date;

  -- Check if rewards already distributed for this week's Friday ending date
  SELECT rewards_distributed INTO distributed
  FROM public.leaderboard_seasons
  WHERE week_end_date = current_friday;

  IF distributed IS TRUE THEN
    RETURN json_build_object('message', 'Rewards already distributed for this week', 'alreadyDone', true);
  END IF;

  -- Ensure it's Friday after 11:30 PM or weekend (Dhaka timezone)
  -- Day of week: Friday is 5. Time >= 23:30 (11:30 PM).
  -- Or Day of week is Saturday (6) or Sunday (0).
  IF NOT (
    (EXTRACT(dow FROM (now() AT TIME ZONE 'Asia/Dhaka')) = 5 AND (now() AT TIME ZONE 'Asia/Dhaka')::time >= '23:30:00'::time) OR
    (EXTRACT(dow FROM (now() AT TIME ZONE 'Asia/Dhaka')) IN (0, 6))
  ) THEN
    RETURN json_build_object('message', 'Too early for weekly rewards', 'alreadyDone', false);
  END IF;

  -- Create a new leaderboard season record
  INSERT INTO public.leaderboard_seasons (week_end_date, rewards_distributed)
  VALUES (current_friday, true)
  RETURNING id INTO new_season_id;

  -- For each active game, find the top 3 players and award XP
  FOR game_rec IN SELECT id, key FROM public.games WHERE is_active = true LOOP
    rank1_id := NULL;
    rank2_id := NULL;
    rank3_id := NULL;

    -- Fetch top 3 winners with tie-breaker logic
    -- Tie-breakers order: Score (Desc), Duration (Asc), Timestamp Achieved (Asc)
    FOR winner IN (
      SELECT 
        gaming_profile_id,
        ROW_NUMBER() OVER (
          ORDER BY 
            weekly_best_score DESC, 
            COALESCE(weekly_best_score_duration, 999999) ASC, 
            COALESCE(last_played_at, '1970-01-01 00:00:00+00'::timestamptz) ASC
        ) as calculated_rank
      FROM public.arcade_scores
      WHERE game_id = game_rec.id AND weekly_best_score > 0
      LIMIT 3
    ) LOOP
      -- Award rewards to Rank 1 (50 XP)
      IF winner.calculated_rank = 1 THEN
        rank1_id := winner.gaming_profile_id;
        UPDATE public.gaming_profiles
        SET 
          xp = xp + 50,
          lifetime_xp = lifetime_xp + 50,
          xp_from_prizes = xp_from_prizes + 50
        WHERE id = rank1_id;

        INSERT INTO public.leaderboard_season_winners (season_id, game_id, rank, gaming_profile_id)
        VALUES (new_season_id, game_rec.id, 1, rank1_id);

      -- Award rewards to Rank 2 (50 XP)
      ELSIF winner.calculated_rank = 2 THEN
        rank2_id := winner.gaming_profile_id;
        UPDATE public.gaming_profiles
        SET 
          xp = xp + 50,
          lifetime_xp = lifetime_xp + 50,
          xp_from_prizes = xp_from_prizes + 50
        WHERE id = rank2_id;

        INSERT INTO public.leaderboard_season_winners (season_id, game_id, rank, gaming_profile_id)
        VALUES (new_season_id, game_rec.id, 2, rank2_id);

      -- Award rewards to Rank 3 (50 XP)
      ELSIF winner.calculated_rank = 3 THEN
        rank3_id := winner.gaming_profile_id;
        UPDATE public.gaming_profiles
        SET 
          xp = xp + 50,
          lifetime_xp = lifetime_xp + 50,
          xp_from_prizes = xp_from_prizes + 50
        WHERE id = rank3_id;

        INSERT INTO public.leaderboard_season_winners (season_id, game_id, rank, gaming_profile_id)
        VALUES (new_season_id, game_rec.id, 3, rank3_id);
      END IF;
    END LOOP;

    winners_json := winners_json || jsonb_build_object(
      'gameKey', game_rec.key,
      'rank1', rank1_id,
      'rank2', rank2_id,
      'rank3', rank3_id
    );
  END LOOP;

  -- Soft Reset: Clear weekly best scores, durations, and play counts to start the next season
  UPDATE public.arcade_scores
  SET
    weekly_best_score = 0,
    weekly_best_score_duration = 0,
    latest_score = 0,
    latest_score_duration = 0,
    weekly_plays_count = 0,
    last_played_at = now()
  WHERE weekly_best_score >= 0;

  RETURN json_build_object(
    'message', 'Weekly rewards distributed and leaderboard reset successfully',
    'winners', winners_json
  );
END;
$$;

-- 3. Schedule the cron job using pg_cron
-- Run every hour starting from Friday 11:30 PM until end of week to ensure recovery in case of downtime.
-- The function's internal safeguards prevent double-distribution.
-- Note: '0 * * * *' runs every hour. We set the scheduling to run pg_cron checks.
-- Alternatively, schedule to check every hour to guarantee resilience:
-- Safely unschedule if the job already exists to avoid XX000 error
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'weekly-leaderboard-rewards-job';
SELECT cron.schedule(
  'weekly-leaderboard-rewards-job',
  '0 * * * 5,6', -- Run at the start of every hour on Fridays and Saturdays (resilient to downtime)
  'SELECT public.process_weekly_rewards();'
);
