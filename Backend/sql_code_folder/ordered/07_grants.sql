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
grant select, insert, update, delete on public.friendships to authenticated;
grant select, insert, delete on public.follows to authenticated;
grant select, insert, delete on public.follows to service_role;
grant select on public.follows to anon;
grant select, insert, delete on public.saved_items to authenticated;
grant select, insert, delete on public.saved_items to service_role;
revoke all on public.quick_shares from authenticated, anon;
grant select, insert, update, delete on public.quick_shares to service_role;
GRANT ALL ON public.institution_memberships TO authenticated, anon;
GRANT ALL ON public.department_memberships TO authenticated, anon;
GRANT ALL ON public.groups TO authenticated, anon;
GRANT ALL ON public.group_memberships TO authenticated, anon;
GRANT ALL ON public.rooms TO authenticated, anon;
GRANT ALL ON public.room_memberships TO authenticated, anon;
GRANT ALL ON public.boxes TO authenticated, anon;
GRANT ALL ON public.box_submissions TO authenticated, anon;
GRANT ALL ON public.gaming_profiles TO authenticated, anon;
GRANT ALL ON public.arcade_scores TO authenticated, anon;
GRANT ALL ON public.leaderboard_seasons TO authenticated, anon;
GRANT ALL ON public.leaderboard_season_winners TO authenticated, anon;
GRANT ALL ON public.saved_items TO authenticated, anon;

-- Messaging Grants
grant select, insert, update, delete on public.conversations to authenticated, service_role;
grant select, insert, update, delete on public.conversation_members to authenticated, service_role;
grant select, insert, update, delete on public.messages to authenticated, service_role;


