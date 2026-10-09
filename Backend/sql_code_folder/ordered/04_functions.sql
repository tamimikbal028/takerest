-- 1. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Handle New User Signup from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  others_cat_id UUID;
BEGIN
  -- Generate unique username from email
  base_username := lower(split_part(NEW.email, '@', 1));
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  IF char_length(base_username) < 3 THEN
    base_username := 'user_' || substr(md5(random()::text), 1, 6);
  END IF;
  
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.users WHERE user_name = final_username) LOOP
    final_username := base_username || floor(random() * 10000)::text;
  END LOOP;

  -- 1. Insert into public.users
  INSERT INTO public.users (
    id,
    full_name,
    email,
    user_name,
    user_type,
    education_level,
    agree_to_terms
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    final_username,
    COALESCE((NEW.raw_user_meta_data->>'user_type')::public.user_type, 'STUDENT'),
    COALESCE((NEW.raw_user_meta_data->>'education_level')::public.education_level, 'K12'),
    COALESCE((NEW.raw_user_meta_data->>'agree_to_terms')::boolean, true)
  );

  -- 2. Insert Starter Category: Others
  INSERT INTO public.categories (user_id, name, color, icon, is_system_default, sort_order)
  VALUES (NEW.id, 'Others', '#64748B', 'clock', false, 1)
  RETURNING id INTO others_cat_id;

  -- 3. Insert Starter Activities under Others
  INSERT INTO public.activities (user_id, category_id, name, sort_order)
  VALUES 
    (NEW.id, others_cat_id, 'Rest', 1),
    (NEW.id, others_cat_id, 'Meal', 2),
    (NEW.id, others_cat_id, 'Break', 3);

  -- 4. Initialize Active Timer (stopped by default)
  INSERT INTO public.active_timer (user_id, category_id, title, started_at, is_running)
  VALUES (NEW.id, others_cat_id, 'Others', now(), false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
