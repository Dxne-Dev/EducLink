-- ============================================================
-- EDULINK v2 — TEACHER REGISTRY LOOKUP RPC
-- Migration 009 : Fonction RPC pour vérifier le registre lors de l'inscription (sans blocage RLS anonyme)
-- ============================================================

-- 1. Fonction sécurisée (SECURITY DEFINER) appelable lors du signup (anonyme)
CREATE OR REPLACE FUNCTION public.check_teacher_email(p_email TEXT)
RETURNS TABLE (
  id UUID,
  is_used BOOLEAN,
  full_name TEXT,
  filiere_id UUID
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tr.id, tr.is_used, tr.full_name, tr.filiere_id
  FROM public.teacher_registry tr
  WHERE LOWER(TRIM(tr.email)) = LOWER(TRIM(p_email))
  LIMIT 1;
$$;

-- 2. Accorder l'exécution aux rôles anon et authenticated
GRANT EXECUTE ON FUNCTION public.check_teacher_email(TEXT) TO anon, authenticated, service_role;

-- 3. Politique permissive en lecture pour teacher_registry (sécurité basée sur l'email)
DROP POLICY IF EXISTS "registry_select_anon_check" ON public.teacher_registry;
CREATE POLICY "registry_select_anon_check"
  ON public.teacher_registry FOR SELECT
  USING (true);
