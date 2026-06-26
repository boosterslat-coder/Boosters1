-- Update the handle_new_user trigger to auto-grant admin to dev account
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email = 'dev@10eurobanknote.local'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;