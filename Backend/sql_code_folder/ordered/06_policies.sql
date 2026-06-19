-- ========================================================
-- CLEANUP & ENABLE RLS DYNAMICALLY ON ALL TABLES
-- ========================================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    -- 1. Drop all existing RLS policies in public schema
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;

    -- 2. Enable RLS on all tables in public schema dynamically
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP 
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- ========================================================
-- READ POSTS (Direct Supabase Call)
-- ========================================================
create policy "read_posts_select_self"
  on public.read_posts
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "read_posts_manage_self"
  on public.read_posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "read_posts_delete_self"
  on public.read_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);
