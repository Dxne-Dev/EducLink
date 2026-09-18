-- ============================================================
-- EDULINK v2 — TEACHER MATIERES MIGRATION
-- Migration 007 : Table pivot teacher_matieres
-- ============================================================

CREATE TABLE IF NOT EXISTS public.teacher_matieres (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_registry_id UUID REFERENCES public.teacher_registry(id) ON DELETE CASCADE,
  matiere_id          UUID NOT NULL REFERENCES public.matieres(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_teacher_source CHECK (teacher_id IS NOT NULL OR teacher_registry_id IS NOT NULL)
);

COMMENT ON TABLE public.teacher_matieres IS
  'Table pivot associant un enseignant (compte actif ou registre) à une matière enseignée';

-- Indexes pour les recherches par enseignant ou par matière
CREATE INDEX IF NOT EXISTS idx_tm_teacher_id ON public.teacher_matieres(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tm_registry_id ON public.teacher_matieres(teacher_registry_id);
CREATE INDEX IF NOT EXISTS idx_tm_matiere_id ON public.teacher_matieres(matiere_id);

-- RLS
ALTER TABLE public.teacher_matieres ENABLE ROW LEVEL SECURITY;

-- Lecture permise pour tout utilisateur authentifié (étudiants pour voir leurs profs, profs pour voir leurs matières)
DROP POLICY IF EXISTS "tm_select_authenticated" ON public.teacher_matieres;
CREATE POLICY "tm_select_authenticated"
  ON public.teacher_matieres FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Gestion complète réservée aux admins
DROP POLICY IF EXISTS "tm_manage_admin" ON public.teacher_matieres;
CREATE POLICY "tm_manage_admin"
  ON public.teacher_matieres FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger pour synchroniser teacher_id quand un enseignant du registre active son compte
CREATE OR REPLACE FUNCTION public.sync_teacher_matieres_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'teacher' THEN
    -- Trouve l'entrée du registre correspondant à cet email
    UPDATE public.teacher_matieres tm
    SET teacher_id = NEW.id
    FROM public.teacher_registry tr
    WHERE tm.teacher_registry_id = tr.id
    AND LOWER(tr.email) = LOWER((SELECT email FROM auth.users WHERE id = NEW.id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_teacher_matieres ON public.profiles;
CREATE TRIGGER trg_sync_teacher_matieres
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_teacher_matieres_on_signup();
