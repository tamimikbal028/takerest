-- TRIGGERS

-- 1. updated_at triggers
DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_tracker_subjects_updated_at ON public.tracker_subjects;
CREATE TRIGGER trigger_tracker_subjects_updated_at
  BEFORE UPDATE ON public.tracker_subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_tracker_preferences_updated_at ON public.tracker_preferences;
CREATE TRIGGER trigger_tracker_preferences_updated_at
  BEFORE UPDATE ON public.tracker_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Auth user creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
