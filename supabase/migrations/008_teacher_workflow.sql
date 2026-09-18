-- ============================================================
-- EDULINK v2 — TEACHER WORKFLOW MIGRATION
-- Migration 008 : RLS, annee_scolaire, resource visibility
-- ============================================================

-- 1. Colonne optionnelle pour filtrage par année scolaire
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS annee_scolaire TEXT;

COMMENT ON COLUMN public.resources.annee_scolaire IS
  'Année scolaire de la ressource (ex: 2024-2025). Optionnel.';

-- 2. RLS pour la table resources
--    Les politiques existantes peuvent être incomplètes pour les enseignants.
--    On recrée proprement les politiques de lecture et d'écriture.

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Lecture : 
--   - Les étudiants voient uniquement les ressources publiques
--   - Les enseignants voient TOUTES leurs propres ressources (public + private)
--   - Les admins voient tout
DROP POLICY IF EXISTS "resources_select_policy" ON public.resources;
CREATE POLICY "resources_select_policy"
  ON public.resources FOR SELECT
  USING (
    -- Admin : tout voir
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Enseignant : ses propres ressources (toutes visibilités)
    uploaded_by = auth.uid()
    OR
    -- Tout utilisateur authentifié : ressources publiques validées
    (visibility = 'public' AND status = 'validated')
    OR
    -- Accès multi-promo via table pivot
    EXISTS (
      SELECT 1 FROM public.resource_promo_access rpa
      WHERE rpa.resource_id = resources.id
      AND rpa.visibility = 'public'
    )
  );

-- Insert : enseignants et admins uniquement
DROP POLICY IF EXISTS "resources_insert_policy" ON public.resources;
CREATE POLICY "resources_insert_policy"
  ON public.resources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
    AND uploaded_by = auth.uid()
  );

-- Update : propriétaire ou admin
DROP POLICY IF EXISTS "resources_update_policy" ON public.resources;
CREATE POLICY "resources_update_policy"
  ON public.resources FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Delete : propriétaire ou admin
DROP POLICY IF EXISTS "resources_delete_policy" ON public.resources;
CREATE POLICY "resources_delete_policy"
  ON public.resources FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3. Index pour accélérer le filtre par uploader (bibliothèque perso du prof)
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON public.resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_resources_annee_scolaire ON public.resources(annee_scolaire);
