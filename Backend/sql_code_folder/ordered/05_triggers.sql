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

drop trigger if exists set_comments_updated_at on public.comments;
create trigger set_comments_updated_at before update on public.comments for each row execute function public.set_updated_at();
drop trigger if exists on_reaction_change on public.reactions;
create trigger on_reaction_change
after insert or delete on public.reactions
for each row execute function public.sync_reaction_stats();
drop trigger if exists on_comment_change_sync_count on public.comments;
create trigger on_comment_change_sync_count
after insert or update or delete on public.comments
for each row execute function public.sync_comments_count();
drop trigger if exists on_post_created_mark_as_read on public.posts;
create trigger on_post_created_mark_as_read
after insert on public.posts
for each row execute function public.auto_mark_own_post_as_read();
drop trigger if exists on_post_change_sync_count on public.posts;
create trigger on_post_change_sync_count
after insert or update on public.posts
for each row execute function public.sync_posts_count();
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
drop trigger if exists set_friendships_updated_at on public.friendships;
create trigger set_friendships_updated_at
before update on public.friendships
for each row execute function public.set_updated_at();
drop trigger if exists on_friendship_change on public.friendships;
create trigger on_friendship_change
after insert or update or delete on public.friendships
for each row execute function public.sync_friendship_stats();
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
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-create Group Owner Membership on Group Creation
drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row
  execute function public.handle_new_group_creator();
