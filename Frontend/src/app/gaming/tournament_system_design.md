# Tournament/Competition System Design & Implementation Plan

We will build a **Tournament/Competition System** around the existing arcade games (`math-sprint`, `grid-hunter`, `pattern-pulse`). Instead of just playing for daily XP, users can compete in limited-time, **university-specific**, and **multi-day stage-based** tournaments to win XP and **tickets (vouchers)**.

> [!IMPORTANT]
> **Legacy Code Cleanup**: All existing/legacy placeholder pages, table designs, and configurations related to "Tournament" in the student app and admin dashboard will be **fully deleted** and replaced with this new relational architecture.

---

## Architecture Decisions & Constraints

1. **Midnight 10-Minute Buffer (Race Condition Prevention)**:
   - **Daily Round Closes**: At exactly **11:55 PM Dhaka Time** (23:55), the active day's round is locked. No new attempts can be started or submitted.
   - **Daily Cron Execution**: At exactly **11:56 PM Dhaka Time** (23:56), the server cron job runs to calculate rankings, select qualifiers, reset daily scores, and increment `current_day`.
   - **Next Day Round Opens**: At exactly **12:05 AM Dhaka Time** (00:05) of the next day, the next round opens for play. This gives a safe 9-minute buffer for processing all data.
2. **Dynamic Games Per Round**: A new table `public.tournament_stage_rounds` is introduced. This allows admins to configure a different game for each individual round of a day.
3. **Single Attempt per Round**: A participant gets exactly **one attempt** for each round. Starting the round immediately registers the attempt. Disconnecting or closing the app mid-game results in a score of **0** for that round.
4. **Cumulative Daily Score**: The total score of a participant for any day is the **sum of scores** from all rounds of that day. Tie-breakers are decided by the sum of durations across those rounds (lower is better).
5. **Zero Play Cost in Tournaments**: Registration fee is paid once in XP when joining. Playing the tournament rounds is free.
6. **Master Ticket Templates & User Tickets**: Ranks map to ticket templates. Winners receive unique ticket instances stored in `public.user_tickets` (visible in Achievements tab).
7. **Prize Validation Constraints**:
   - Ranks in `public.tournament_prizes` must exactly cover `1` through `total_winners_count`. No overlaps, no gaps.
   - `total_winners_count` must **not exceed** the `qualifiers_limit` of the final stage.
     $$\text{total\_winners\_count} \le \text{qualifiers\_limit of Day } (N-1)$$

---

## Proposed Database Schema

We will create new tables in Supabase:

### 1. `public.games` **[COMPLETED - ALREADY IN DATABASE]**

This table is already created and seeded with game configurations (e.g. `math-sprint`, `grid-hunter`, `pattern-pulse`, `speed-equate`).

```sql
-- Already created in public schema
CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE, -- e.g. 'math-sprint', 'grid-hunter'
  title text NOT NULL,
  description text,
  icon_url text,
  content_config jsonb NOT NULL DEFAULT '{}'::jsonb, -- Custom settings, levels, question pools, etc.
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 2. `public.ticket_templates`

Defines standard ticket voucher values.

```sql
CREATE TABLE public.ticket_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  amount numeric(10, 2) NOT NULL CHECK (amount >= 0.00), -- Ticket monetary value
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 3. `public.tournaments`

Main metadata for the tournament, now supporting extensible modes and formats.

```sql
CREATE TYPE public.tournament_status AS ENUM ('UPCOMING', 'ACTIVE', 'FINISHED');
CREATE TYPE public.tournament_mode AS ENUM ('SOLO', 'TEAM');
CREATE TYPE public.tournament_format AS ENUM ('LEADERBOARD', 'BRACKET');

CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE, -- Lock to a university
  start_at timestamptz NOT NULL, -- Fixed to 00:05:00 Dhaka time (must be >= tomorrow on creation)
  end_at timestamptz NOT NULL,   -- Fixed to 23:55:00 Dhaka time
  duration_days integer NOT NULL DEFAULT 3 CHECK (duration_days > 0),
  entry_fee_tokens integer NOT NULL DEFAULT 50 CHECK (entry_fee_tokens >= 0), -- Paid once in XP
  total_winners_count integer NOT NULL DEFAULT 3 CHECK (total_winners_count > 0), -- Total number of players receiving prizes
  mode public.tournament_mode NOT NULL DEFAULT 'SOLO', -- For future team tournaments
  format public.tournament_format NOT NULL DEFAULT 'LEADERBOARD', -- For future bracket tournaments
  status public.tournament_status NOT NULL DEFAULT 'UPCOMING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 4. `public.tournament_stages`

Configures the calendar day and qualifiers limit for each stage of the tournament.

```sql
CREATE TABLE public.tournament_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  day_number integer NOT NULL CHECK (day_number >= 1),
  qualifiers_limit integer CHECK (qualifiers_limit > 0), -- NULL for the final day (no qualifiers needed)
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, day_number)
);
```

### 5. `public.tournament_stage_rounds`

Configures the specific game assigned for each round of each day.

```sql
CREATE TABLE public.tournament_stage_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES public.tournament_stages(id) ON DELETE CASCADE,
  round_number integer NOT NULL CHECK (round_number >= 1),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE RESTRICT, -- Game ID from public.games table
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stage_id, round_number)
);
```

### 6. `public.tournament_prizes`

Configures rewards (XP and tickets) for specific ranks on the final day.

```sql
CREATE TABLE public.tournament_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  rank_start integer NOT NULL CHECK (rank_start > 0),
  rank_end integer NOT NULL CHECK (rank_end >= rank_start),
  prize_xp integer NOT NULL DEFAULT 0 CHECK (prize_xp >= 0),
  ticket_template_id uuid REFERENCES public.ticket_templates(id) ON DELETE SET NULL, -- References the won ticket template
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 7. `public.tournament_participants`

Tracks joined players, supporting future team scaling.

```sql
CREATE TABLE public.tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  gaming_profile_id uuid NOT NULL REFERENCES public.gaming_profiles(id) ON DELETE CASCADE,
  team_id uuid, -- For future team tournament support (nullable for solo)
  current_day integer NOT NULL DEFAULT 1 CHECK (current_day >= 1),
  is_qualified boolean NOT NULL DEFAULT true, -- Becomes false if eliminated
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, gaming_profile_id)
);
```

### 8. `public.tournament_attempts`

Logs every attempt/round played by a participant.

```sql
CREATE TABLE public.tournament_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.tournament_participants(id) ON DELETE CASCADE,
  stage_round_id uuid NOT NULL REFERENCES public.tournament_stage_rounds(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  duration numeric(8, 2) NOT NULL DEFAULT 0.00 CHECK (duration >= 0),
  gameplay_state jsonb NOT NULL DEFAULT '{}'::jsonb, -- Server-side state tracking
  played_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_id, stage_round_id) -- User plays each round configuration exactly once
);
```

### 9. `public.user_tickets`

Tracks the actual tickets won by users.

```sql
CREATE TYPE public.ticket_status AS ENUM ('AVAILABLE', 'USED', 'EXPIRED');

CREATE TABLE public.user_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ticket_template_id uuid NOT NULL REFERENCES public.ticket_templates(id) ON DELETE CASCADE,
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE SET NULL, -- Tracks origin
  unique_code text NOT NULL UNIQUE, -- Unique code/hash for scanning/validation
  status public.ticket_status NOT NULL DEFAULT 'AVAILABLE',
  used_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

---

## Proposed Backend Changes

### Component: `Backend`

- **Midnight 10-Minute Buffer Validation**:
  Enforce API level locks:
  - Block starting or submitting any attempts between `23:55:00` and `00:05:00` Dhaka time.
- **Prize Validation**:
  Validate rank ranges, overlaps, gaps, and that `total_winners_count` does not exceed the finalist count (`qualifiers_limit` of stage `N-1`).
- **Daily Progression Logic**:
  - The daily progression task sums the score of all `tournament_attempts` linked to the active day's `stage_round_id`s for each participant and advances only the top `qualifiers_limit` users.
- **Tournament Resolution & Ticket Generation**:
  On the final day, generate `public.user_tickets` and award `prize_xp` to the top winners.

---

## Proposed Frontend & Admin Changes

### Component: `Frontend-Admin`

- **Create Tournament Form**:
  - Start Date picker (enforces minimum 1-day gap).
  - Day configuration with rounds and game selector.

### Component: `Frontend`

- **Tournament Lobby**: Displays a list of the rounds. Users click "Play" next to each round. Shows a countdown to `11:55 PM` for the active stage. If the time is between `11:55 PM` and `12:05 AM`, displays a "Calculating Results..." placeholder.
- **Achievements Page**: Tab to list user's won tickets.
