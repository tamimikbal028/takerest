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
create index if not exists post_categories_scope_idx on public.post_categories (post_on_model, post_on_id);
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

-- Messaging Indexes
create index if not exists messages_conversation_idx on public.messages(conversation_id);
create index if not exists messages_created_at_idx on public.messages(created_at asc);
create index if not exists conversation_members_user_idx on public.conversation_members(user_id);
