==============================================================================
TAKE REST (Study & Rest/Break Tracker Platform)
DATABASE SETUP INSTRUCTIONS (FOR SUPABASE)
==============================================================================

Option 1: Single-Step Setup (Recommended)
------------------------------------------------------------------------------
1. Open your Supabase Project Dashboard (https://supabase.com/dashboard).
2. Go to the "SQL Editor" tab from the left sidebar.
3. Click "New query".
4. Copy the entire contents of:
   sql_code_folder/db_setup_master.sql
5. Paste into the SQL Editor and click "Run".
6. Done! All tables, types, triggers, indexes, and RLS policies are created.

Option 2: Step-by-Step Setup
------------------------------------------------------------------------------
Run the files in the "ordered" directory in numerical order:
1. ordered/01_extensions_types.sql  -> Sets up extensions and enums
2. ordered/02_tables.sql            -> Creates users, subjects, sessions, preferences
3. ordered/03_indexes.sql           -> Creates performance indexes
4. ordered/04_functions.sql         -> Creates functions (handle_new_user, set_updated_at)
5. ordered/05_triggers.sql          -> Attaches triggers
6. ordered/06_policies.sql          -> Enables and creates Row Level Security (RLS)
7. ordered/07_grants.sql            -> Grants access permissions to service_role

What Gets Created:
------------------------------------------------------------------------------
- users: Core user profiles (synced with auth.users)
- tracker_subjects: User-created subjects with target hours, colors, icons
- tracker_sessions: Study & Break logs with durations, focus ratings, notes
- tracker_preferences: Daily goals, pomodoro work/break lengths, sound settings
- Starter defaults: Whenever a new user signs up, default preferences and 3 starter subjects are automatically generated for them.
