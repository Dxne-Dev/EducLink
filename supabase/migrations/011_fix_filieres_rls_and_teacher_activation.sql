-- ============================================================
-- EDULINK v2 — FIX FILIERES PUBLIC ACCESS, NIVEAU_ID ON PROFILES & TEACHER ACTIVATION
-- Migration 011 : RLS + colonnes profiles (email, niveau_id) + sync auto
-- ============================================================

-- 1. Permettre la lecture publique des filières, niveaux et matières
--    Nécessaire lors du formulaire d'inscription (/signup) pour les visiteurs anonymes.

DROP POLICY IF EXISTS "filieres_select_auth" ON public.filieres;
DROP POLICY IF EXISTS "filieres_select_public" ON public.filieres;
CREATE POLICY "filieres_select_public"
  ON public.filieres FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "niveaux_select_auth" ON public.niveaux;
DROP POLICY IF EXISTS "niveaux_select_public" ON public.niveaux;
CREATE POLICY "niveaux_select_public"
  ON public.niveaux FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "matieres_select_auth" ON public.matieres;
DROP POLICY IF EXISTS "matieres_select_public" ON public.matieres;
CREATE POLICY "matieres_select_public"
  ON public.matieres FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "promotions_select_auth" ON public.promotions;
DROP POLICY IF EXISTS "promotions_select_public" ON public.promotions;
CREATE POLICY "promotions_select_public"
  ON public.promotions FOR SELECT
  USING (true);

-- 2. Ajouter les colonnes manquantes à public.profiles (email, niveau_id)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS niveau_id UUID REFERENCES public.niveaux(id) ON DELETE SET NULL;

-- Backfill des emails existants depuis auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 3. Mise à jour de la fonction trigger handle_new_user avec gestion complète étudiant & enseignant
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_filiere_id UUID;
  v_niveau_id  UUID;
  v_promo_id   UUID;
  v_role       public.user_role;
BEGIN
  -- Extraction sécurisée de filiere_id
  BEGIN
    v_filiere_id := (NEW.raw_user_meta_data->>'filiere_id')::uuid;
  EXCEPTION WHEN others THEN
    v_filiere_id := NULL;
  END;

  -- Extraction sécurisée de niveau_id
  BEGIN
    v_niveau_id := (NEW.raw_user_meta_data->>'niveau_id')::uuid;
  EXCEPTION WHEN others THEN
    v_niveau_id := NULL;
  END;

  -- Extraction sécurisée de promo_id
  BEGIN
    v_promo_id := (NEW.raw_user_meta_data->>'promo_id')::uuid;
  EXCEPTION WHEN others THEN
    v_promo_id := NULL;
  END;

  -- Extraction sécurisée du rôle avec fallback 'student'
  BEGIN
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student')::public.user_role;
  EXCEPTION WHEN others THEN
    v_role := 'student'::public.user_role;
  END;

  -- Pour un étudiant : rattacher automatiquement à la promotion active si non fournie
  IF v_role = 'student' AND v_filiere_id IS NOT NULL AND v_niveau_id IS NOT NULL AND v_promo_id IS NULL THEN
    SELECT id INTO v_promo_id
    FROM public.promotions
    WHERE filiere_id = v_filiere_id
      AND niveau_id = v_niveau_id
      AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Insertion ou mise à jour idempotente dans public.profiles
  INSERT INTO public.profiles (id, full_name, role, filiere_id, niveau_id, promo_id, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    v_role,
    v_filiere_id,
    v_niveau_id,
    v_promo_id,
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name  = EXCLUDED.full_name,
    role       = EXCLUDED.role,
    filiere_id = COALESCE(EXCLUDED.filiere_id, public.profiles.filiere_id),
    niveau_id  = COALESCE(EXCLUDED.niveau_id, public.profiles.niveau_id),
    promo_id   = COALESCE(EXCLUDED.promo_id, public.profiles.promo_id),
    email      = EXCLUDED.email;

  -- Inscrire automatiquement l'étudiant dans sa promotion
  IF v_role = 'student' AND v_promo_id IS NOT NULL THEN
    INSERT INTO public.enrollments (student_id, promotion_id)
    VALUES (NEW.id, v_promo_id)
    ON CONFLICT (student_id, promotion_id) DO NOTHING;
  END IF;

  -- Si un enseignant s'inscrit :
  -- 1. Marquer immédiatement son entrée dans teacher_registry comme utilisée (activée)
  -- 2. Lier les matières précédemment affectées via teacher_registry_id à son ID de profil (teacher_id)
  IF v_role = 'teacher' THEN
    UPDATE public.teacher_registry
    SET is_used = true
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email));

    UPDATE public.teacher_matieres tm
    SET teacher_id = NEW.id
    FROM public.teacher_registry tr
    WHERE tm.teacher_registry_id = tr.id
    AND LOWER(TRIM(tr.email)) = LOWER(TRIM(NEW.email));
  END IF;

  RETURN NEW;
END;
$$;

-- Réattachement propre du trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Rattrapage pour les étudiants déjà inscrits dont la filière/niveau était dans les metadata
UPDATE public.profiles p
SET 
  filiere_id = COALESCE(p.filiere_id, NULLIF((u.raw_user_meta_data->>'filiere_id'), '')::uuid),
  niveau_id  = COALESCE(p.niveau_id, NULLIF((u.raw_user_meta_data->>'niveau_id'), '')::uuid),
  promo_id   = COALESCE(p.promo_id, NULLIF((u.raw_user_meta_data->>'promo_id'), '')::uuid, (
    SELECT pr.id FROM public.promotions pr 
    WHERE pr.filiere_id = NULLIF((u.raw_user_meta_data->>'filiere_id'), '')::uuid 
      AND pr.niveau_id = NULLIF((u.raw_user_meta_data->>'niveau_id'), '')::uuid 
      AND pr.is_active = true 
    ORDER BY pr.created_at DESC LIMIT 1
  ))
FROM auth.users u
WHERE p.id = u.id AND p.role = 'student';

-- 5. Rattrapage pour les enseignants déjà inscrits
UPDATE public.teacher_registry tr
SET is_used = true
WHERE tr.is_used = false
AND EXISTS (
  SELECT 1 FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(tr.email))
  AND p.role = 'teacher'
);

UPDATE public.teacher_matieres tm
SET teacher_id = p.id
FROM public.teacher_registry tr
JOIN auth.users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(tr.email))
JOIN public.profiles p ON p.id = u.id AND p.role = 'teacher'
WHERE tm.teacher_registry_id = tr.id
AND tm.teacher_id IS NULL;
