-- ============================================================
-- EDULINK v2 — MODEL REFACTOR
-- Migration 006 : visibility, multi-promo access, teacher registry,
--                 filiere_id on profiles & templates, RLS corrections
-- ============================================================

-- ============================================================
-- 1. RESOURCE VISIBILITY
-- ============================================================

CREATE TYPE resource_visibility AS ENUM ('private', 'public');

ALTER TABLE public.resources
  ADD COLUMN visibility resource_visibility NOT NULL DEFAULT 'private';

-- ============================================================
-- 2. MULTI-PROMO ACCESS (no file duplication)
-- ============================================================

CREATE TABLE public.resource_promo_access (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id  UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  promo_id     UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  visibility   resource_visibility NOT NULL DEFAULT 'private',
  granted_by   UUID NOT NULL REFERENCES public.profiles(id),
  granted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(resource_id, promo_id)
);

COMMENT ON TABLE public.resource_promo_access IS
  'Rend une ressource accessible à plusieurs promos sans dupliquer le fichier storage';

CREATE INDEX idx_rpa_resource ON public.resource_promo_access(resource_id);
CREATE INDEX idx_rpa_promo    ON public.resource_promo_access(promo_id);

-- ============================================================
-- 3. TEACHER REGISTRY
-- ============================================================

CREATE TABLE public.teacher_registry (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  employee_id TEXT,
  filiere_id  UUID REFERENCES public.filieres(id) ON DELETE SET NULL,
  is_used     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.teacher_registry IS
  'Registre des enseignants connus — vérifié avant création de compte teacher';

-- ============================================================
-- 4. FILIERE_ID SUR PROFILES (pour les étudiants)
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN filiere_id UUID REFERENCES public.filieres(id) ON DELETE SET NULL;

-- ============================================================
-- 5. FILIERE_ID SUR TEMPLATES
-- ============================================================

ALTER TABLE public.templates
  ADD COLUMN filiere_id UUID REFERENCES public.filieres(id) ON DELETE SET NULL;

-- ============================================================
-- 6. TRIGGER handle_new_user — lecture filiere_id dans metadata
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
  -- Récupère filiere_id depuis les metadata (null si non fourni ou invalide)
  BEGIN
    v_filiere_id := (NEW.raw_user_meta_data->>'filiere_id')::uuid;
  EXCEPTION WHEN others THEN
    v_filiere_id := NULL;
  END;

  BEGIN
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student')::public.user_role;
  EXCEPTION WHEN others THEN
    v_role := 'student'::public.user_role;
  END;

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

-- ============================================================
-- 7. RLS — resource_promo_access
-- ============================================================

ALTER TABLE public.resource_promo_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rpa_select_auth"
  ON public.resource_promo_access FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "rpa_insert_owner_or_admin"
  ON public.resource_promo_access FOR INSERT
  WITH CHECK (
    get_user_role() = 'admin'
    OR (
      get_user_role() = 'teacher'
      AND granted_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.resources r
        WHERE r.id = resource_id AND r.uploaded_by = auth.uid()
      )
    )
  );

CREATE POLICY "rpa_delete_owner_or_admin"
  ON public.resource_promo_access FOR DELETE
  USING (
    get_user_role() = 'admin'
    OR (
      granted_by = auth.uid()
      AND get_user_role() = 'teacher'
    )
  );

-- ============================================================
-- 8. RLS — teacher_registry
-- ============================================================

ALTER TABLE public.teacher_registry ENABLE ROW LEVEL SECURITY;

-- Tout utilisateur connecté peut lire (nécessaire pour la vérif signup via server action)
CREATE POLICY "registry_select_auth"
  ON public.teacher_registry FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "registry_modify_admin"
  ON public.teacher_registry FOR ALL
  USING (get_user_role() = 'admin');

-- ============================================================
-- 9. RLS resources — corrections
-- ============================================================

-- Supprimer les anciennes policies resources
DROP POLICY IF EXISTS "resources_select_student" ON public.resources;
DROP POLICY IF EXISTS "resources_delete_admin"   ON public.resources;
DROP POLICY IF EXISTS "resources_insert_teacher" ON public.resources;

-- Étudiant : ressources publiques de ses promos uniquement
CREATE POLICY "resources_select_student"
  ON public.resources FOR SELECT
  USING (
    get_user_role() = 'student'
    AND visibility = 'public'
    AND status = 'validated'
    AND (
      -- Ressource dans une promo où l'étudiant est inscrit
      EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.student_id = auth.uid()
        AND e.promotion_id = resources.promo_id
      )
      OR
      -- Ressource partagée vers une promo de l'étudiant
      EXISTS (
        SELECT 1 FROM public.resource_promo_access rpa
        JOIN public.enrollments e ON e.promotion_id = rpa.promo_id
        WHERE rpa.resource_id = resources.id
        AND e.student_id = auth.uid()
        AND rpa.visibility = 'public'
      )
    )
  );

-- Enseignant / admin peuvent supprimer (owner ou admin)
CREATE POLICY "resources_delete_owner_or_admin"
  ON public.resources FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR get_user_role() = 'admin'
  );

-- Insert réservé aux teachers et admins
CREATE POLICY "resources_insert_teacher"
  ON public.resources FOR INSERT
  WITH CHECK (
    get_user_role() IN ('teacher', 'admin')
    AND uploaded_by = auth.uid()
  );

-- ============================================================
-- 10. FILIERES ACCESSIBLES POUR L'INSCRIPTION (PUBLIC)
-- ============================================================

DROP POLICY IF EXISTS "filieres_select_public" ON public.filieres;
CREATE POLICY "filieres_select_public"
  ON public.filieres FOR SELECT
  USING (true);

-- Permettre la lecture du registre lors du signup
DROP POLICY IF EXISTS "registry_select_anon" ON public.teacher_registry;
CREATE POLICY "registry_select_anon"
  ON public.teacher_registry FOR SELECT
  USING (true);

