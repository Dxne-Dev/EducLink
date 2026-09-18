-- ============================================================
-- EDULINK v2 — FIX TRIGGER HANDLE_NEW_USER SEARCH_PATH & TYPE CAST
-- Migration 010 : Résout l'erreur 42704 "type user_role does not exist"
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_filiere_id UUID;
  v_role public.user_role;
BEGIN
  -- 1. Extraction sécurisée de filiere_id
  BEGIN
    v_filiere_id := (NEW.raw_user_meta_data->>'filiere_id')::uuid;
  EXCEPTION WHEN others THEN
    v_filiere_id := NULL;
  END;

  -- 2. Extraction sécurisée du rôle avec fallback 'student'
  BEGIN
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student')::public.user_role;
  EXCEPTION WHEN others THEN
    v_role := 'student'::public.user_role;
  END;

  -- 3. Insertion idempotente dans public.profiles
  INSERT INTO public.profiles (id, full_name, role, filiere_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    v_role,
    v_filiere_id
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name  = EXCLUDED.full_name,
    role       = EXCLUDED.role,
    filiere_id = EXCLUDED.filiere_id;

  RETURN NEW;
END;
$$;

-- 4. Réattachement propre du trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
