drop table if exists public.institution_memberships cascade;
drop table if exists public.departments cascade;
drop table if exists public.institutions cascade;
drop table if exists public.users cascade;
drop table if exists public.follows cascade;
drop table if exists public.friendships cascade;

-- সতর্কবার্তা: নিচের লাইনটি রান করলে সব ইউজার এবং পাসওয়ার্ড মুছে যাবে। 
delete from auth.users;

-- পুরনো ট্রিগার এবং ফাংশন মুছে ফেলা (যদি থাকে)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ১. এক্সটেনশন সেটাপ
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

-- ২. কাস্টম টাইপস (Enums) তৈরি
do $$
begin
  -- User Enums
  if not exists (select 1 from pg_type where typname = 'account_status') then create type public.account_status as enum ('ACTIVE', 'DELETED'); end if;
  if not exists (select 1 from pg_type where typname = 'user_type') then create type public.user_type as enum ('ADMIN', 'MODERATOR', 'TEACHER', 'STUDENT'); end if;
  if not exists (select 1 from pg_type where typname = 'education_level') then create type public.education_level as enum ('UNIVERSITY', 'K12'); end if;
  if not exists (select 1 from pg_type where typname = 'gender') then create type public.gender as enum ('MALE', 'FEMALE'); end if;
  if not exists (select 1 from pg_type where typname = 'religion') then create type public.religion as enum ('Islam', 'Hindu', 'Christian', 'Others'); end if;
  if not exists (select 1 from pg_type where typname = 'friend_request_policy') then create type public.friend_request_policy as enum ('EVERYONE', 'NOBODY'); end if;
  if not exists (select 1 from pg_type where typname = 'connection_visibility') then create type public.connection_visibility as enum ('PUBLIC', 'CONNECTIONS', 'ONLY_ME'); end if;
  
  -- Institution Enums
  if not exists (select 1 from pg_type where typname = 'institution_type') then create type public.institution_type as enum ('GENERAL_UNIVERSITY','ENGINEERING_UNIVERSITY','SCIENCE_TECHNOLOGY_UNIVERSITY','MEDICAL_COLLEGE','COLLEGE','POLYTECHNIC_INSTITUTE','SCHOOL','OTHER'); end if;
  if not exists (select 1 from pg_type where typname = 'institution_category') then create type public.institution_category as enum ('PUBLIC', 'PRIVATE', 'NATIONAL', 'GOVT', 'NON_GOVT'); end if;
  if not exists (select 1 from pg_type where typname = 'institution_role') then create type public.institution_role as enum ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'); end if;
  
  -- Department Enums
  if not exists (select 1 from pg_type where typname = 'department_role') then create type public.department_role as enum ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'); end if;
  if not exists (select 1 from pg_type where typname = 'teacher_rank') then create type public.teacher_rank as enum ('Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Instructor'); end if;

  -- Post Enums
  if not exists (select 1 from pg_type where typname = 'post_type') then create type public.post_type as enum ('GENERAL', 'NOTICE', 'RESOURCE', 'POLL', 'QUESTION', 'ASSIGNMENT', 'VIDEO', 'BUY_SELL'); end if;
  if not exists (select 1 from pg_type where typname = 'attachment_type') then create type public.attachment_type as enum ('IMAGE', 'VIDEO', 'PDF', 'DOC', 'LINK'); end if;
  if not exists (select 1 from pg_type where typname = 'post_visibility') then create type public.post_visibility as enum ('PUBLIC', 'CONNECTIONS', 'ONLY_ME', 'INTERNAL'); end if;
  if not exists (select 1 from pg_type where typname = 'post_status') then create type public.post_status as enum ('PENDING', 'APPROVED', 'REJECTED'); end if;
  if not exists (select 1 from pg_type where typname = 'post_target_model') then create type public.post_target_model as enum ('USER', 'INSTITUTION', 'DEPARTMENT', 'GROUP', 'ROOM', 'PAGE', 'CR_CORNER'); end if;
  if not exists (select 1 from pg_type where typname = 'saved_item_type') then create type public.saved_item_type as enum ('POST', 'VIDEO', 'ARTICLE'); end if;

  -- Group Enums
  if not exists (select 1 from pg_type where typname = 'group_type') then create type public.group_type as enum ('GENERAL', 'JOBS_CAREERS', 'OFFICIAL_INSTITUTION'); end if;
  if not exists (select 1 from pg_type where typname = 'group_privacy') then create type public.group_privacy as enum ('PUBLIC', 'PRIVATE', 'CLOSED'); end if;
  if not exists (select 1 from pg_type where typname = 'group_role') then create type public.group_role as enum ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'); end if;
  if not exists (select 1 from pg_type where typname = 'group_membership_status') then create type public.group_membership_status as enum ('JOINED', 'PENDING', 'INVITED', 'BANNED'); end if;
  if not exists (select 1 from pg_type where typname = 'group_join_method') then create type public.group_join_method as enum ('DIRECT_JOIN', 'REQUEST_APPROVAL', 'INVITE', 'CREATOR'); end if;

  -- Room Enums
  if not exists (select 1 from pg_type where typname = 'room_type') then create type public.room_type as enum ('UNIVERSITY', 'COLLEGE', 'COACHING', 'SCHOOL', 'GENERAL'); end if;
  if not exists (select 1 from pg_type where typname = 'room_privacy') then create type public.room_privacy as enum ('PUBLIC', 'PRIVATE', 'CLOSED'); end if;
  if not exists (select 1 from pg_type where typname = 'room_membership_status') then create type public.room_membership_status as enum ('JOINED', 'PENDING', 'REJECTED', 'BANNED'); end if;

  -- Gaming Enums
  if not exists (select 1 from pg_type where typname = 'arcade_game_key') then create type public.arcade_game_key as enum ('math-sprint', 'grid-hunter', 'pattern-pulse'); end if;
exception when others then null; end $$;

