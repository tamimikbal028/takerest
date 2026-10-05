-- PERMISSIONS & GRANTS

-- Allow full access to service_role (Used by backend API client)
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON TABLE public.tracker_subjects TO service_role;
GRANT ALL ON TABLE public.tracker_sessions TO service_role;
GRANT ALL ON TABLE public.tracker_preferences TO service_role;
