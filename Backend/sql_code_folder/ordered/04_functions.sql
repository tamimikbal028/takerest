create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ৪. টেবিল তৈরি (Dependency সিরিয়াল অনুযায়ী)
create or replace function public.sync_reaction_stats()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (TG_OP = 'INSERT') then
    if (new.post_id is not null) then
      update public.posts set likes_count = likes_count + 1 where id = new.post_id;
    elsif (new.comment_id is not null) then
      update public.comments set likes_count = likes_count + 1 where id = new.comment_id;
    end if;
  elsif (TG_OP = 'DELETE') then
    if (old.post_id is not null) then
      update public.posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
    elsif (old.comment_id is not null) then
      update public.comments set likes_count = greatest(0, likes_count - 1) where id = old.comment_id;
    end if;
  end if;
  return null;
end; $$;
create or replace function public.sync_comments_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (TG_OP = 'INSERT') then
    if (not new.is_deleted) then
      update public.posts set comments_count = comments_count + 1 where id = new.post_id;
    end if;
  elsif (TG_OP = 'UPDATE') then
    if (new.is_deleted and not old.is_deleted) then
      update public.posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
    elsif (not new.is_deleted and old.is_deleted) then
      update public.posts set comments_count = comments_count + 1 where id = new.post_id;
    end if;
  elsif (TG_OP = 'DELETE') then
    if (not old.is_deleted) then
      update public.posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
    end if;
  end if;
  return null;
end; $$;
create or replace function public.auto_mark_own_post_as_read()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.read_posts (user_id, post_id)
  values (new.author_id, new.id)
  on conflict do nothing;
  return new;
end; $$;
create or replace function public.sync_posts_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (TG_OP = 'INSERT') then
    if (new.status = 'APPROVED' and not new.is_deleted) then
      if (new.post_on_user_id is not null) then
        update public.users set posts_count = posts_count + 1 where id = new.post_on_user_id;
      end if;
    end if;
  elsif (TG_OP = 'UPDATE') then
    -- Transitioning to deleted (Soft Delete)
    if (new.is_deleted and not old.is_deleted) then
      if (old.status = 'APPROVED') then
        if (old.post_on_user_id is not null) then
          update public.users set posts_count = greatest(0, posts_count - 1) where id = old.post_on_user_id;
        end if;
      end if;
    -- Transitioning from pending to approved
    elsif (new.status = 'APPROVED' and old.status = 'PENDING' and not new.is_deleted) then
      if (new.post_on_user_id is not null) then
        update public.users set posts_count = posts_count + 1 where id = new.post_on_user_id;
      end if;
    end if;
  end if;
  return null;
end; $$;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  final_username text;
begin
  -- ইমেইলের প্রথম অংশ থেকে বেস ইউজারনেম তৈরি
  base_username := lower(split_part(new.email, '@', 1));
  base_username := regexp_replace(base_username, '[^a-z0-9]', '', 'g');
  final_username := base_username;

  -- ইউনিক হওয়া পর্যন্ত লুপ চালাচ্ছি
  while exists (select 1 from public.users where user_name = final_username) loop
    final_username := base_username || floor(random() * 10000)::text;
  end loop;

  insert into public.users (id, full_name, email, user_name, user_type, education_level, agree_to_terms)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email,
    final_username,
    coalesce((new.raw_user_meta_data->>'user_type')::public.user_type, 'STUDENT'),
    coalesce((new.raw_user_meta_data->>'education_level')::public.education_level, 'K12'),
    coalesce((new.raw_user_meta_data->>'agree_to_terms')::boolean, true)
  );
  return new;
end; $$;
create or replace function public.is_post_owner(target_post_id uuid, user_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.posts 
    where id = target_post_id and author_id = user_id
  );
$$;
create or replace function public.sync_friendship_stats()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (TG_OP = 'INSERT') then
    if (new.status = 'ACCEPTED') then
      update public.users set connections_count = connections_count + 1 where id = new.requester_id or id = new.recipient_id;
    end if;
  elsif (TG_OP = 'UPDATE') then
    if (old.status = 'ACCEPTED' and new.status <> 'ACCEPTED') then
      update public.users set connections_count = greatest(0, connections_count - 1) where id = old.requester_id or id = old.recipient_id;
    elsif (old.status <> 'ACCEPTED' and new.status = 'ACCEPTED') then
      update public.users set connections_count = connections_count + 1 where id = new.requester_id or id = new.recipient_id;
    end if;
  elsif (TG_OP = 'DELETE') then
    if (old.status = 'ACCEPTED') then
      update public.users set connections_count = greatest(0, connections_count - 1) where id = old.requester_id or id = old.recipient_id;
    end if;
  end if;
  return null;
end; $$;
create or replace function public.sync_follow_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (TG_OP = 'INSERT') then
    -- Increment follower's following_count
    update public.users set following_count = following_count + 1 where id = new.follower_id;
    
    -- Increment target's followers_count based on target_model
    if (upper(new.target_model) = 'USER') then
      update public.users set followers_count = followers_count + 1 where id = new.following_id;
    elsif (upper(new.target_model) = 'INSTITUTION') then
      update public.institutions set followers_count = followers_count + 1 where id = new.following_id;
    elsif (upper(new.target_model) = 'DEPARTMENT') then
      update public.departments set followers_count = followers_count + 1 where id = new.following_id;
    end if;

  elsif (TG_OP = 'DELETE') then
    -- Decrement follower's following_count
    update public.users set following_count = greatest(0, following_count - 1) where id = old.follower_id;
    
    -- Decrement target's followers_count based on target_model
    if (upper(old.target_model) = 'USER') then
      update public.users set followers_count = greatest(0, followers_count - 1) where id = old.following_id;
    elsif (upper(old.target_model) = 'INSTITUTION') then
      update public.institutions set followers_count = greatest(0, followers_count - 1) where id = old.following_id;
    elsif (upper(old.target_model) = 'DEPARTMENT') then
      update public.departments set followers_count = greatest(0, followers_count - 1) where id = old.following_id;
    end if;
  end if;
  
  return null;
end; $$;

-- Auto-follow institution/department when a membership becomes active.
create or replace function public.auto_follow_on_membership()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target_id uuid;
  v_target_model text;
begin
  -- Only follow on fresh join or re-join.
  if (TG_OP = 'INSERT' and coalesce(new.is_deleted, false) = false) then
    null;
  elsif (
    TG_OP = 'UPDATE'
    and coalesce(old.is_deleted, false) = true
    and coalesce(new.is_deleted, false) = false
  ) then
    null;
  else
    return new;
  end if;

  if (TG_TABLE_NAME = 'institution_memberships') then
    target_id := new.institution_id;
    v_target_model := 'INSTITUTION';
  elsif (TG_TABLE_NAME = 'department_memberships') then
    target_id := new.department_id;
    v_target_model := 'DEPARTMENT';
  else
    return new;
  end if;

  -- Safe insert: if already followed, do nothing.
  insert into public.follows (follower_id, following_id, target_model)
  values (new.user_id, target_id, v_target_model)
  on conflict (follower_id, following_id, target_model) do nothing;

  return new;
end; $$;
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  final_username text;
begin
  -- Email এর প্রথম অংশ থেকে base username তৈরি করা
  base_username := lower(split_part(new.email, '@', 1));
  base_username := regexp_replace(base_username, '[^a-z0-9_.]', '', 'g');

  -- Empty হলে fallback
  if base_username = '' then
    base_username := 'user';
  end if;

  final_username := base_username;

  -- Unique না হলে random number যোগ করা
  while exists (select 1 from public.users where user_name = final_username) loop
    final_username := base_username || floor(random() * 90000 + 10000)::text;
  end loop;

  insert into public.users (
    id,
    full_name,
    email,
    user_name,
    user_type,
    education_level,
    agree_to_terms
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email,
    final_username,
    coalesce((new.raw_user_meta_data->>'user_type')::public.user_type, 'STUDENT'),
    coalesce((new.raw_user_meta_data->>'education_level')::public.education_level, 'K12'),
    coalesce((new.raw_user_meta_data->>'agree_to_terms')::boolean, true)
  );

  return new;
end;
$$;
create or replace function public.search_hashtags(query_text text, page_offset integer, page_limit integer)
returns table(name text, count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select lower(t) as name, count(*) as count
  from public.posts,
       unnest(tags) as t
  where is_deleted = false
    and status = 'APPROVED'
    and visibility in ('PUBLIC', 'INTERNAL')
    and lower(t) like lower(query_text)
  group by lower(t)
  order by count desc, lower(t) asc
  offset page_offset
  limit page_limit;
end;
$$;

-- Count unique hashtags matching a query (partial, case-insensitive)
create or replace function public.search_hashtags_count(query_text text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  total_count bigint;
begin
  select count(distinct lower(t))
  into total_count
  from public.posts,
       unnest(tags) as t
  where is_deleted = false
    and status = 'APPROVED'
    and visibility in ('PUBLIC', 'INTERNAL')
    and lower(t) like lower(query_text);
  
  return coalesce(total_count, 0);
end;
$$;

-- Auto-create Group Owner Membership on Group Creation
create or replace function public.handle_new_group_creator()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.group_memberships (
    group_id, 
    user_id, 
    role, 
    status, 
    join_method, 
    joined_at
  )
  values (
    new.id, 
    new.creator_id, 
    'OWNER', 
    'JOINED', 
    'CREATOR', 
    now()
  );
  return new;
end; $$;
