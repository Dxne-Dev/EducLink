-- ============================================================
-- STORAGE BUCKETS + ROW LEVEL SECURITY POLICIES
-- ============================================================

-- ============================================================
-- BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('resources',   'resources',   FALSE),
  ('internships', 'internships', FALSE),
  ('templates',   'templates',   TRUE),
  ('avatars',     'avatars',     TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RESOURCES (cours, fiches, TP, examens)
-- Lecture : tous les authentifiés
-- Upload : enseignants et administrateurs
-- ============================================================

CREATE POLICY "resources_select_authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resources');

CREATE POLICY "resources_insert_teacher"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resources'
    AND public.get_user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "resources_delete_teacher"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resources'
    AND public.get_user_role() IN ('teacher', 'admin')
  );

-- ============================================================
-- INTERNSHIPS (rapports de stage)
-- Lecture et écriture : administrateurs uniquement
-- ============================================================

CREATE POLICY "internships_select_admin"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'internships'
    AND public.get_user_role() = 'admin'
  );

CREATE POLICY "internships_insert_admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'internships'
    AND public.get_user_role() = 'admin'
  );

CREATE POLICY "internships_delete_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'internships'
    AND public.get_user_role() = 'admin'
  );

-- ============================================================
-- TEMPLATES (modèles & trames)
-- Lecture publique (bucket public)
-- Upload : enseignants et administrateurs
-- ============================================================

CREATE POLICY "templates_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'templates');

CREATE POLICY "templates_insert_teacher"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'templates'
    AND public.get_user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "templates_delete_teacher"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'templates'
    AND public.get_user_role() IN ('teacher', 'admin')
  );

-- ============================================================
-- AVATARS (photos de profil)
-- Lecture publique (bucket public)
-- Upload : chaque utilisateur pour son propre avatar
-- ============================================================

CREATE POLICY "avatars_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );
