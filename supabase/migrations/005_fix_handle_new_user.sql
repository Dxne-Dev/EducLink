-- ============================================================
-- FIX: 500 "Database error saving new user" on signup
--
-- Root cause: the handle_new_user trigger failed at insert time.
-- The cast ::user_role was unqualified and the function had no
-- fixed search_path, so SECURITY DEFINER execution could not
-- resolve the public.user_role type.
--
-- This migration is idempotent and safe to re-run.
-- ============================================================

-- 1) Recreate the trigger function with a fixed search_path and
--    a fully-qualified enum cast.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::public.user_role
  );
  RETURN NEW;
END;
$$;

-- 2) Ensure the trigger is attached to auth.users (idempotent:
--    drop the existing one first, then recreate).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3) Guard against FORCE ROW LEVEL SECURITY on profiles, which
--    would block even the SECURITY DEFINER insert (no INSERT
--    policy exists). NOT FORCE is the default; this is a safety net.
ALTER TABLE public.profiles NO FORCE ROW LEVEL SECURITY;

-- 4) As a belt-and-braces measure, grant the insert path used by
--    the SECURITY DEFINER function (owner runs as postgres, so
--    this is normally unnecessary — kept for clarity).
GRANT INSERT ON public.profiles TO service_role;
