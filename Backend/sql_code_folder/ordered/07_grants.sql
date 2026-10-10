GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON TABLE public.categories TO service_role;
GRANT ALL ON TABLE public.activities TO service_role;
GRANT ALL ON TABLE public.time_logs TO service_role;
GRANT ALL ON TABLE public.active_timer TO service_role;

-- Grants for authenticated users (Frontend client with active session)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
