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



