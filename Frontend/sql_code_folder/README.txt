==============================================================================
TAKE REST: 24-HOUR CONTINUOUS DAY TRACKER
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

What Gets Created:
------------------------------------------------------------------------------
1. users: Core user profile (synced with auth.users).
2. categories: Groups created by user (e.g., Deen, Academic, Others).
3. activities: Specific items under groups (e.g., Namaz, Talimuddin, Courses).
7. finance_transactions: Money tracker (daily expenses & income with categories, amounts, payment methods).
8. sin_logs: Gunah / Muhasabah tracker (daily sins, severity, triggers, and repentance/Tawbah status).

Existing Database Migration:
------------------------------------------------------------------------------
If you ALREADY ran db_setup_master.sql earlier, you only need to run:
   sql_code_folder/08_finance_and_sins.sql
in Supabase SQL Editor to add the two new features!

