-- ========================================================
-- BIDDA DATABASE SETUP (MASTER SCRIPT)
-- এটি রান করলে আপনার সব টেবিল, ইনাম, ট্রিগার এবং আরএলএস একবারে সেটআপ হবে।

-- ========================================================

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

-- ৩. ইউটিলিটি ফাংশন
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ৪. টেবিল তৈরি (Dependency সিরিয়াল অনুযায়ী)

-- [Table: Users]
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  password_changed_at timestamptz,
  user_name text not null unique check (user_name ~* '^[a-z0-9_.]+$'),
  phone_number text,
  avatar text default null,
  cover_image text default null,
  bio text check (char_length(bio) <= 300),
  gender public.gender,
  religion public.religion,
  social_links jsonb not null default '{}'::jsonb,
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  connections_count integer not null default 0 check (connections_count >= 0),
  followers_count integer not null default 0 check (followers_count >= 0),
  following_count integer not null default 0 check (following_count >= 0),
  posts_count integer not null default 0 check (posts_count >= 0),
  public_files_count integer not null default 0 check (public_files_count >= 0),
  user_type public.user_type not null default 'STUDENT',
  education_level public.education_level not null,
  account_status public.account_status not null default 'ACTIVE',
  deleted_at timestamptz default null,
  friend_request_policy public.friend_request_policy not null default 'EVERYONE',
  connection_visibility public.connection_visibility not null default 'ONLY_ME',
  is_comment_blocked boolean not null default false,
  is_post_blocked boolean not null default false,
  is_message_blocked boolean not null default false,
  comment_restriction_reason text,
  comment_restricted_at timestamptz,
  comment_restricted_by uuid references public.users(id) on delete set null,
  post_restriction_reason text,
  post_restricted_at timestamptz,
  post_restricted_by uuid references public.users(id) on delete set null,
  message_restriction_reason text,
  message_restricted_at timestamptz,
  message_restricted_by uuid references public.users(id) on delete set null,
  agree_to_terms boolean not null,
  terms_agreed_at timestamptz not null default now(),
  is_institutional_email boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- [Table: Institutions]
create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  type public.institution_type not null default 'GENERAL_UNIVERSITY',
  category public.institution_category not null default 'PUBLIC',
  description text,
  valid_domains text[] not null default '{}',
  location text not null,
  website text,
  logo text,
  cover_image text,
  contact_emails text[] not null default '{}',
  contact_phones text[] not null default '{}',
  is_active boolean not null default true,
  posts_count integer not null default 0 check (posts_count >= 0),
  followers_count integer not null default 0 check (followers_count >= 0),
  departments_count integer not null default 0 check (departments_count >= 0),
  students_count integer not null default 0 check (students_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint institutions_code_uppercase check (code = upper(code))
);

-- [Table: University Profiles]
create table if not exists public.university_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  institution_id uuid references public.institutions(id) on delete set null,
  current_semester text,
  department text,
  cgpa numeric(4, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint university_profiles_cgpa_range check (cgpa is null or (cgpa >= 0.00 and cgpa <= 4.00))
);

-- [Table: Departments]
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  description text,
  cover_image text,
  logo text,
  website text,
  established_year integer,
  contact_emails text[] not null default '{}',
  contact_phones text[] not null default '{}',
  location text,
  valid_domains text[] not null default '{}',
  is_active boolean not null default true,
  posts_count integer not null default 0 check (posts_count >= 0),
  students_count integer not null default 0 check (students_count >= 0),
  followers_count integer not null default 0 check (followers_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_code_uppercase check (code = upper(code)),
  constraint departments_institution_name_unique unique (institution_id, name),
  constraint departments_institution_code_unique unique (institution_id, code)
);

-- [Table: Institution Memberships]
create table if not exists public.institution_memberships (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.institution_role not null default 'MEMBER',
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint institution_memberships_institution_user_unique unique (institution_id, user_id)
);

-- [Table: Department Memberships]
create table if not exists public.department_memberships (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  role public.department_role not null default 'MEMBER',

  -- Student Information
  student_is_student boolean not null default false,
  student_id text,
  student_session text,
  student_section text,
  student_semester integer,
  student_enrolled_at timestamptz,
  student_cgpa numeric(4, 2),
  student_credits numeric(6, 2),

  -- Faculty Information
  faculty_is_faculty boolean not null default false,
  faculty_teacher_id text,
  faculty_position public.teacher_rank,
  faculty_joined_at timestamptz,
  faculty_office_room text,
  faculty_office_hours text[] not null default '{}',
  faculty_research_interests text[] not null default '{}',
  faculty_publications integer not null default 0 check (faculty_publications >= 0),

  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint department_memberships_department_user_unique
    unique (department_id, user_id),
  constraint department_memberships_student_cgpa_range
    check (student_cgpa is null or (student_cgpa >= 0 and student_cgpa <= 4)),
  constraint department_memberships_student_semester_positive
    check (student_semester is null or student_semester > 0)
);

-- ========================================================
-- GROUPS & GROUP MEMBERSHIPS
-- ========================================================
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) <= 100),
  slug text not null unique,
  description text check (char_length(description) <= 500),
  avatar text default null,
  cover_image text default null,
  institution_id uuid references public.institutions(id) on delete set null,
  type public.group_type not null,
  privacy public.group_privacy not null default 'PUBLIC',
  allow_member_posting boolean not null default true,
  require_post_approval boolean not null default false,
  members_count integer not null default 0 check (members_count >= 0),
  posts_count integer not null default 0 check (posts_count >= 0),
  creator_id uuid not null references public.users(id) on delete restrict,
  owner_id uuid not null references public.users(id) on delete restrict,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_slug_lowercase check (slug = lower(slug))
);

create table if not exists public.group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.group_role not null default 'MEMBER',
  status public.group_membership_status not null default 'JOINED',
  join_method public.group_join_method not null default 'DIRECT_JOIN',
  invited_by_id uuid references public.users(id) on delete set null,
  joined_at timestamptz,
  is_muted boolean not null default false,
  is_following boolean not null default true,
  is_pinned boolean not null default false,
  is_post_blocked boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_memberships_group_user_unique unique (group_id, user_id)
);

-- ========================================================
-- ROOMS & ROOM MEMBERSHIPS
-- ========================================================
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_image text default null,
  room_type public.room_type not null,
  privacy public.room_privacy not null default 'PUBLIC',
  join_code text not null unique,
  creator_id uuid not null references public.users(id) on delete restrict,
  is_archived boolean not null default false,
  is_deleted boolean not null default false,
  allow_student_posting boolean not null default true,
  allow_comments boolean not null default true,
  require_post_approval boolean not null default false,
  members_count integer not null default 0 check (members_count >= 0),
  posts_count integer not null default 0 check (posts_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_memberships (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status public.room_membership_status not null default 'JOINED',
  is_owner boolean not null default false,
  is_cr boolean not null default false,
  is_admin boolean not null default false,
  is_hidden boolean not null default false,
  is_post_blocked boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint room_memberships_room_user_unique unique (room_id, user_id)
);

-- [Table: Post Categories]
create table if not exists public.post_categories (
  id uuid primary key default gen_random_uuid(),
  post_on_model public.post_target_model not null,
  post_on_id uuid not null,
  name text not null,
  name_normalized text not null,
  created_by_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_categories_scope_name_unique unique (post_on_model, post_on_id, name_normalized)
);


-- [Table: Posts]
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null check (char_length(content) <= 5000),
  type public.post_type not null default 'GENERAL',
  visibility public.post_visibility not null default 'PUBLIC',
  status public.post_status not null default 'APPROVED',
  post_on_model public.post_target_model not null,
  post_on_user_id uuid references public.users(id) on delete cascade,
  post_on_institution_id uuid references public.institutions(id) on delete cascade,
  post_on_department_id uuid references public.departments(id) on delete cascade,
  post_on_group_id uuid references public.groups(id) on delete cascade,
  post_on_room_id uuid references public.rooms(id) on delete cascade,
  likes_count integer not null default 0 check (likes_count >= 0),
  comments_count integer not null default 0 check (comments_count >= 0),
  shares_count integer not null default 0 check (shares_count >= 0),
  reads_count integer not null default 0 check (reads_count >= 0),
  is_edited boolean not null default false,
  edited_at timestamptz default null,
  is_archived boolean not null default false,
  is_pinned boolean not null default false,
  is_deleted boolean not null default false,
  category_id uuid references public.post_categories(id) on delete set null,
  tags text[] not null default '{}',
  external_links text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_target_only_one check (
    (
      (post_on_user_id is not null)::integer +
      (post_on_institution_id is not null)::integer +
      (post_on_department_id is not null)::integer +
      (post_on_group_id is not null)::integer +
      (post_on_room_id is not null)::integer
    ) = 1
  )
);

-- [Table: Post Attachments]
create table if not exists public.post_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  type public.attachment_type not null,
  url text not null,
  name text,
  size integer check (size >= 0),
  created_at timestamptz not null default now()
);

-- [Table: Post Poll Options]
create table if not exists public.post_poll_options (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  option_text text not null,
  votes_count integer not null default 0 check (votes_count >= 0),
  created_at timestamptz not null default now()
);

-- [Table: Post Poll Votes]
create table if not exists public.post_poll_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  option_id uuid not null references public.post_poll_options(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint post_poll_votes_unique_user_option unique (option_id, user_id)
);

-- [Table: Comments]
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) <= 1000),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  likes_count integer not null default 0 check (likes_count >= 0),
  is_edited boolean not null default false,
  edited_at timestamptz default null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- [Table: Reactions]
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint reactions_target_only_one check (
    (
      (post_id is not null)::integer +
      (comment_id is not null)::integer
    ) = 1
  )
);

-- [Table: Read Posts]
create table if not exists public.read_posts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint read_posts_post_user_unique unique (post_id, user_id)
);

-- [Table: Saved Items]
create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  target_type public.saved_item_type not null default 'POST',
  target_id uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint saved_items_user_target_unique unique (user_id, target_type, target_id)
);

-- ৫. ইনডেক্স সেটাপ
create index if not exists users_user_name_trgm_idx on public.users using gin (user_name gin_trgm_ops);
create index if not exists university_profiles_institution_idx on public.university_profiles (institution_id);

-- Institutions Indexes
create index if not exists institutions_type_category_idx on public.institutions (type, category);
create index if not exists institutions_location_type_idx on public.institutions (location, type);
create index if not exists institutions_valid_domains_idx on public.institutions using gin (valid_domains);
create index if not exists institutions_name_trgm_idx on public.institutions using gin (name gin_trgm_ops);
create index if not exists institutions_code_trgm_idx on public.institutions using gin (code gin_trgm_ops);
create index if not exists institutions_location_trgm_idx on public.institutions using gin (location gin_trgm_ops);

-- Departments Indexes
create index if not exists departments_institution_is_active_idx on public.departments (institution_id, is_active);
create index if not exists departments_valid_domains_idx on public.departments using gin (valid_domains);
create index if not exists departments_name_trgm_idx on public.departments using gin (name gin_trgm_ops);
create index if not exists departments_code_trgm_idx on public.departments using gin (code gin_trgm_ops);

-- Institution Memberships Indexes
create index if not exists institution_memberships_institution_idx on public.institution_memberships (institution_id);
create index if not exists institution_memberships_user_idx on public.institution_memberships (user_id);
create index if not exists institution_memberships_active_user_idx on public.institution_memberships (user_id, is_deleted);

-- Department Memberships Indexes
create index if not exists department_memberships_department_idx on public.department_memberships (department_id);
create index if not exists department_memberships_user_idx on public.department_memberships (user_id);
create index if not exists department_memberships_institution_user_idx on public.department_memberships (institution_id, user_id);
create index if not exists department_memberships_student_is_student_idx on public.department_memberships (student_is_student);
create index if not exists department_memberships_faculty_is_faculty_idx on public.department_memberships (faculty_is_faculty);
create unique index if not exists department_memberships_department_student_id_unique on public.department_memberships (department_id, student_id) where student_id is not null and is_deleted = false;
create unique index if not exists department_memberships_department_teacher_id_unique on public.department_memberships (department_id, faculty_teacher_id) where faculty_teacher_id is not null and is_deleted = false;

-- Post, Comment, Reaction & Read Post Indexes
create index if not exists posts_author_id_idx on public.posts (author_id);
create index if not exists posts_type_idx on public.posts (type);
create index if not exists posts_visibility_idx on public.posts (visibility);
create index if not exists posts_post_on_user_idx on public.posts (post_on_user_id) where post_on_user_id is not null;
create index if not exists posts_content_trgm_idx on public.posts using gin (content gin_trgm_ops);
create index if not exists post_attachments_post_id_idx on public.post_attachments (post_id);
create index if not exists post_poll_options_post_id_idx on public.post_poll_options (post_id);
create index if not exists post_poll_votes_post_id_user_id_idx on public.post_poll_votes (post_id, user_id);
create index if not exists comments_post_id_idx on public.comments (post_id);
create index if not exists comments_author_id_idx on public.comments (author_id);
create index if not exists comments_post_created_idx on public.comments (post_id, created_at desc);
create unique index if not exists reactions_user_post_unique on public.reactions (user_id, post_id) where post_id is not null;
create unique index if not exists reactions_user_comment_unique on public.reactions (user_id, comment_id) where comment_id is not null;
create index if not exists reactions_post_id_idx on public.reactions (post_id) where post_id is not null;
create index if not exists reactions_comment_id_idx on public.reactions (comment_id) where comment_id is not null;
create index if not exists read_posts_user_id_idx on public.read_posts (user_id);
create index if not exists read_posts_post_id_idx on public.read_posts (post_id);
create index if not exists saved_items_user_id_idx on public.saved_items (user_id);
create index if not exists saved_items_target_type_idx on public.saved_items (target_type);
create index if not exists saved_items_target_id_idx on public.saved_items (target_id);
create index if not exists saved_items_user_target_created_idx on public.saved_items (user_id, target_type, created_at desc);

-- ৬. ট্রিগার ফাংশনসমূহ

-- Updated At ট্রিগার্স
drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();

drop trigger if exists set_institutions_updated_at on public.institutions;
create trigger set_institutions_updated_at before update on public.institutions for each row execute function public.set_updated_at();

drop trigger if exists set_departments_updated_at on public.departments;
create trigger set_departments_updated_at before update on public.departments for each row execute function public.set_updated_at();

drop trigger if exists set_institution_memberships_updated_at on public.institution_memberships;
create trigger set_institution_memberships_updated_at before update on public.institution_memberships for each row execute function public.set_updated_at();

drop trigger if exists set_department_memberships_updated_at on public.department_memberships;
create trigger set_department_memberships_updated_at before update on public.department_memberships for each row execute function public.set_updated_at();

drop trigger if exists set_university_profiles_updated_at on public.university_profiles;
create trigger set_university_profiles_updated_at before update on public.university_profiles for each row execute function public.set_updated_at();

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at before update on public.posts for each row execute function public.set_updated_at();

drop trigger if exists set_post_categories_updated_at on public.post_categories;
create trigger set_post_categories_updated_at before update on public.post_categories for each row execute function public.set_updated_at();

drop trigger if exists set_comments_updated_at on public.comments;
create trigger set_comments_updated_at before update on public.comments for each row execute function public.set_updated_at();

-- Reactions count trigger function & trigger
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

drop trigger if exists on_reaction_change on public.reactions;
create trigger on_reaction_change
after insert or delete on public.reactions
for each row execute function public.sync_reaction_stats();

-- Comments count trigger function & trigger
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

drop trigger if exists on_comment_change_sync_count on public.comments;
create trigger on_comment_change_sync_count
after insert or update or delete on public.comments
for each row execute function public.sync_comments_count();

-- Post Auto-Read Trigger Function & Trigger
create or replace function public.auto_mark_own_post_as_read()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.read_posts (user_id, post_id)
  values (new.author_id, new.id)
  on conflict do nothing;
  return new;
end; $$;

drop trigger if exists on_post_created_mark_as_read on public.posts;
create trigger on_post_created_mark_as_read
after insert on public.posts
for each row execute function public.auto_mark_own_post_as_read();

-- Reads count trigger function & trigger
create or replace function public.sync_reads_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (TG_OP = 'INSERT') then
    update public.posts set reads_count = reads_count + 1 where id = new.post_id;
  elsif (TG_OP = 'DELETE') then
    update public.posts set reads_count = greatest(0, reads_count - 1) where id = old.post_id;
  end if;
  return null;
end; $$;

drop trigger if exists on_read_posts_change on public.read_posts;
create trigger on_read_posts_change
after insert or delete on public.read_posts
for each row execute function public.sync_reads_count();

-- Posts count trigger function to automatically update posts_count of target users
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

drop trigger if exists on_post_change_sync_count on public.posts;
create trigger on_post_change_sync_count
after insert or update on public.posts
for each row execute function public.sync_posts_count();

-- Auth ট্রিগার (অটো প্রোফাইল ক্রিয়েশন এবং ইউজারনেম জেনারেটর)
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

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

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row
  execute function public.handle_new_group_creator();

-- ७. সিকিউরিটি (RLS & Grants)
-- RLS is enabled here, while policy rules live in ordered/06_policies.sql.
alter table public.users enable row level security;
alter table public.institutions enable row level security;
alter table public.departments enable row level security;
alter table public.institution_memberships enable row level security;
alter table public.department_memberships enable row level security;
alter table public.groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.rooms enable row level security;
alter table public.room_memberships enable row level security;
alter table public.university_profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_attachments enable row level security;
alter table public.post_poll_options enable row level security;
alter table public.post_poll_votes enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.read_posts enable row level security;
alter table public.quick_shares enable row level security;

grant usage on schema public to authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select, update on all sequences in schema public to service_role;

-- Admin backend (service_role key): explicit grants for admin APIs
grant all privileges on table public.institutions to service_role;
grant all privileges on table public.institution_memberships to service_role;
grant all privileges on table public.departments to service_role;
grant all privileges on table public.department_memberships to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to service_role;

grant select on all tables in schema public to authenticated;
revoke insert, update on public.users from authenticated;
grant insert (id, full_name, email, user_name, user_type, education_level, agree_to_terms) on public.users to authenticated;
grant update (full_name, phone_number, avatar, cover_image, bio, gender, religion, social_links, skills, interests, friend_request_policy, connection_visibility) on public.users to authenticated;

grant select on public.institutions to authenticated;
grant select on public.departments to authenticated;

grant select on public.institution_memberships to authenticated;
grant insert (institution_id, user_id, role, is_deleted) on public.institution_memberships to authenticated;
grant update (role, is_deleted) on public.institution_memberships to authenticated;

grant select on public.department_memberships to authenticated;
grant insert (
  department_id,
  user_id,
  institution_id,
  role,
  student_is_student,
  student_id,
  student_session,
  student_section,
  student_semester,
  student_enrolled_at,
  student_cgpa,
  student_credits,
  faculty_is_faculty,
  faculty_teacher_id,
  faculty_position,
  faculty_joined_at,
  faculty_office_room,
  faculty_office_hours,
  faculty_research_interests,
  is_deleted
) on public.department_memberships to authenticated;
grant update (
  role,
  student_is_student,
  student_id,
  student_session,
  student_section,
  student_semester,
  student_enrolled_at,
  student_cgpa,
  student_credits,
  faculty_is_faculty,
  faculty_teacher_id,
  faculty_position,
  faculty_joined_at,
  faculty_office_room,
  faculty_office_hours,
  faculty_research_interests,
  is_deleted
) on public.department_memberships to authenticated;

grant select on public.university_profiles to authenticated;
grant insert (user_id, institution_id, current_semester, department, cgpa) on public.university_profiles to authenticated;
grant update (institution_id, current_semester, department, cgpa) on public.university_profiles to authenticated;

grant select, insert, update on public.posts to authenticated;
grant select, insert, delete on public.post_attachments to authenticated;
grant select, insert, update on public.post_poll_options to authenticated;
grant select, insert on public.post_poll_votes to authenticated;
grant select, insert, update on public.comments to authenticated;
grant select, insert, delete on public.reactions to authenticated;
grant select, insert, delete on public.read_posts to authenticated;

-- আরএলএস পলিসি সমূহ

-- ========================================================
-- FRIENDSHIPS SECTION (MIGRATED FROM MongoDB)
-- ========================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'friendship_status') then
    create type public.friendship_status as enum ('PENDING', 'ACCEPTED', 'BLOCKED');
  end if;
exception
  when others then null;
end $$;

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  status public.friendship_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self_friendship check (requester_id <> recipient_id)
);

create unique index if not exists friendships_least_greatest_idx 
  on public.friendships (least(requester_id, recipient_id), greatest(requester_id, recipient_id));

create index if not exists friendships_requester_idx on public.friendships (requester_id);
create index if not exists friendships_recipient_idx on public.friendships (recipient_id);
create index if not exists friendships_status_idx on public.friendships (status);

drop trigger if exists set_friendships_updated_at on public.friendships;
create trigger set_friendships_updated_at
before update on public.friendships
for each row execute function public.set_updated_at();

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

drop trigger if exists on_friendship_change on public.friendships;
create trigger on_friendship_change
after insert or update or delete on public.friendships
for each row execute function public.sync_friendship_stats();

alter table public.friendships enable row level security;
grant select, insert, update, delete on public.friendships to authenticated;

-- ========================================================
-- FOLLOWS TABLE
-- ========================================================
-- This table manages follow relationships between users and other entities (Users, Institutions, Departments, etc.)

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null, -- ID of the entity being followed (User, Institution, Department)
  target_model text not null, -- 'USER', 'INSTITUTION', 'DEPARTMENT', etc.
  created_at timestamptz not null default now(),
  
  -- Ensure a user can only follow a specific entity once
  unique (follower_id, following_id, target_model)
);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================
alter table public.follows enable row level security;
-- Explicitly grant privileges to authenticated and service roles
grant select, insert, delete on public.follows to authenticated;
grant select, insert, delete on public.follows to service_role;
grant select on public.follows to anon;

-- ========================================================
-- SAVED ITEMS (BOOKMARKS) ROW LEVEL SECURITY
-- ========================================================
alter table public.saved_items enable row level security;
grant select, insert, delete on public.saved_items to authenticated;
grant select, insert, delete on public.saved_items to service_role;

-- ==========================================
-- TRIGGERS FOR FOLLOW COUNTS
-- ==========================================
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

drop trigger if exists on_follow_change on public.follows;
create trigger on_follow_change
after insert or delete on public.follows
for each row execute function public.sync_follow_counts();

-- Auto-follow after joining institution/department.
drop trigger if exists on_institution_membership_auto_follow on public.institution_memberships;
create trigger on_institution_membership_auto_follow
after insert or update on public.institution_memberships
for each row execute function public.auto_follow_on_membership();

drop trigger if exists on_department_membership_auto_follow on public.department_memberships;
create trigger on_department_membership_auto_follow
after insert or update on public.department_memberships
for each row execute function public.auto_follow_on_membership();

-- ========================================================
-- BOXES & SUBMISSIONS
-- ========================================================
create table if not exists public.boxes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 30),
  code text not null unique,
  field_label text not null default 'Roll Number',
  created_by_id uuid not null references public.users(id) on delete cascade,
  is_accepting boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint boxes_code_uppercase check (code = upper(code))
);

create table if not exists public.box_submissions (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes(id) on delete cascade,
  field_value text not null,
  file_url text not null,
  file_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========================================================
-- QUICK SHARES
-- ========================================================
create table if not exists public.quick_shares (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) = 5),
  file_url text not null,
  file_name text not null,
  file_size bigint not null,
  mimetype text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ========================================================
-- GAMING
-- ========================================================
create table if not exists public.gaming_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  gamer_name text not null unique,
  xp integer not null default 0 check (xp >= 0),
  lifetime_xp integer not null default 0 check (lifetime_xp >= 0),
  xp_from_daily_claim integer not null default 0 check (xp_from_daily_claim >= 0),
  xp_from_prizes integer not null default 0 check (xp_from_prizes >= 0),
  tokens integer not null default 0 check (tokens >= 0),
  last_claim_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gaming_profiles_gamer_name_length check (char_length(gamer_name) between 3 and 15)
);

create table if not exists public.arcade_scores (
  id uuid primary key default gen_random_uuid(),
  gaming_profile_id uuid not null references public.gaming_profiles(id) on delete cascade,
  game_key public.arcade_game_key not null,
  weekly_best_score integer not null default 0 check (weekly_best_score >= 0),
  weekly_best_score_duration integer not null default 0 check (weekly_best_score_duration >= 0),
  lifetime_best_score integer not null default 0 check (lifetime_best_score >= 0),
  latest_score integer not null default 0 check (latest_score >= 0),
  latest_score_duration integer not null default 0 check (latest_score_duration >= 0),
  weekly_plays_count integer not null default 0 check (weekly_plays_count >= 0),
  lifetime_plays_count integer not null default 0 check (lifetime_plays_count >= 0),
  last_played_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint arcade_scores_profile_game_unique unique (gaming_profile_id, game_key)
);

create table if not exists public.leaderboard_seasons (
  id uuid primary key default gen_random_uuid(),
  week_end_date date not null unique,
  rewards_distributed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leaderboard_season_winners (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.leaderboard_seasons(id) on delete cascade,
  game_key public.arcade_game_key not null,
  rank smallint not null check (rank between 1 and 3),
  gaming_profile_id uuid not null references public.gaming_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint leaderboard_season_winners_unique unique (season_id, game_key, rank)
);

-- ==========================================
-- ROW LEVEL SECURITY FOR BOXES AND GAMING
-- ==========================================
alter table public.boxes enable row level security;
alter table public.box_submissions enable row level security;
alter table public.gaming_profiles enable row level security;
alter table public.arcade_scores enable row level security;

-- Boxes & Submissions


-- Gaming Profiles & Arcade Scores


-- ==========================================
-- AUTH TRIGGER: Auto-create public.users on signup
-- ==========================================

-- Trigger function: auth.users তে নতুন user insert হলে public.users এ row তৈরি করে
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==========================================
-- public.users RLS enablement and grants
-- ==========================================
alter table public.users enable row level security;

-- service_role কে full access দাও (backend এর জন্য)
grant select, insert, update, delete on public.users to service_role;

-- authenticated user রা শুধু select করতে পারবে
grant select on public.users to authenticated;

-- Column-level grants (নিজের profile update করার জন্য)
grant insert (id, full_name, email, user_name, user_type, education_level, agree_to_terms) on public.users to authenticated;
grant update (full_name, phone_number, avatar, cover_image, bio, gender, religion, social_links, skills, interests, friend_request_policy, connection_visibility) on public.users to authenticated;

-- ==========================================
-- GRANT PRIVILEGES
-- ==========================================
GRANT ALL ON public.institution_memberships TO authenticated, anon;
GRANT ALL ON public.department_memberships TO authenticated, anon;
GRANT ALL ON public.groups TO authenticated, anon;
GRANT ALL ON public.group_memberships TO authenticated, anon;
GRANT ALL ON public.rooms TO authenticated, anon;
GRANT ALL ON public.room_memberships TO authenticated, anon;
GRANT ALL ON public.boxes TO authenticated, anon;
GRANT ALL ON public.box_submissions TO authenticated, anon;
GRANT ALL ON public.quick_shares TO service_role;
GRANT ALL ON public.gaming_profiles TO authenticated, anon;
GRANT ALL ON public.arcade_scores TO authenticated, anon;
GRANT ALL ON public.leaderboard_seasons TO authenticated, anon;
GRANT ALL ON public.leaderboard_season_winners TO authenticated, anon;
GRANT ALL ON public.saved_items TO authenticated, anon;

-- ==========================================
-- SEARCH FUNCTIONS (MIGRATED FROM MongoDB)
-- ==========================================

-- Search hashtags matching a query (partial, case-insensitive) sorted by post usage count
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

-- ==========================================
-- MESSAGING & CONVERSATIONS SECTION
-- ==========================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  name text, -- Group name (null for DMs)
  avatar text, -- Group avatar (null for DMs)
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

-- Triggers for conversations
drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

-- Indexes for Messaging
create index if not exists messages_conversation_idx on public.messages(conversation_id);
create index if not exists messages_created_at_idx on public.messages(created_at asc);
create index if not exists conversation_members_user_idx on public.conversation_members(user_id);

-- Enable RLS
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- Grants
grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, update, delete on public.conversation_members to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
