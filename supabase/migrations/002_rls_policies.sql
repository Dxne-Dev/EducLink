-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Helper functions (SECURITY DEFINER to avoid recursive RLS)

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "profiles_select_teacher"
  ON public.profiles FOR SELECT
  USING (get_user_role() = 'teacher');

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (get_user_role() = 'admin');

-- ============================================================
-- FILIERES / NIVEAUX / MATIERES
-- ============================================================

ALTER TABLE public.filieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niveaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matieres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "filieres_select_auth"
  ON public.filieres FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "niveaux_select_auth"
  ON public.niveaux FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "matieres_select_auth"
  ON public.matieres FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "filieres_modify_admin"
  ON public.filieres FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "niveaux_modify_admin"
  ON public.niveaux FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "matieres_modify_admin"
  ON public.matieres FOR ALL
  USING (get_user_role() = 'admin');

-- ============================================================
-- PROMOTIONS
-- ============================================================

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions_select_auth"
  ON public.promotions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "promotions_modify_admin"
  ON public.promotions FOR ALL
  USING (get_user_role() = 'admin');

-- ============================================================
-- RESOURCES
-- ============================================================

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resources_select_student"
  ON public.resources FOR SELECT
  USING (
    get_user_role() = 'student'
    AND status IN ('validated', 'archived')
  );

CREATE POLICY "resources_select_teacher"
  ON public.resources FOR SELECT
  USING (
    get_user_role() = 'teacher'
    AND (uploaded_by = auth.uid() OR status IN ('validated', 'archived'))
  );

CREATE POLICY "resources_select_admin"
  ON public.resources FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "resources_insert_teacher"
  ON public.resources FOR INSERT
  WITH CHECK (
    get_user_role() IN ('teacher', 'admin')
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "resources_update_teacher"
  ON public.resources FOR UPDATE
  USING (
    get_user_role() IN ('teacher', 'admin')
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "resources_delete_admin"
  ON public.resources FOR DELETE
  USING (get_user_role() = 'admin');

-- ============================================================
-- RESOURCE VERSIONS
-- ============================================================

ALTER TABLE public.resource_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resource_versions_select"
  ON public.resource_versions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "resource_versions_insert"
  ON public.resource_versions FOR INSERT
  WITH CHECK (
    get_user_role() IN ('teacher', 'admin')
    AND created_by = auth.uid()
  );

-- ============================================================
-- ENROLLMENTS
-- ============================================================

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_select_student"
  ON public.enrollments FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "enrollments_select_teacher"
  ON public.enrollments FOR SELECT
  USING (get_user_role() = 'teacher');

CREATE POLICY "enrollments_modify_admin"
  ON public.enrollments FOR ALL
  USING (get_user_role() = 'admin');

-- ============================================================
-- INTERNSHIPS
-- ============================================================

ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "internships_select"
  ON public.internships FOR SELECT
  USING (
    student_id = auth.uid()
    OR get_user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "internships_insert"
  ON public.internships FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    OR get_user_role() = 'admin'
  );

CREATE POLICY "internships_update"
  ON public.internships FOR UPDATE
  USING (
    student_id = auth.uid()
    OR get_user_role() IN ('teacher', 'admin')
  );

-- ============================================================
-- INTERNSHIP REPORTS
-- ============================================================

ALTER TABLE public.internship_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "internship_reports_select_public"
  ON public.internship_reports FOR SELECT
  USING (
    is_validated = true
    OR get_user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "internship_reports_insert"
  ON public.internship_reports FOR INSERT
  WITH CHECK (
    get_user_role() IN ('student', 'admin')
  );

CREATE POLICY "internship_reports_validate"
  ON public.internship_reports FOR UPDATE
  USING (get_user_role() IN ('teacher', 'admin'));

-- ============================================================
-- TEMPLATES
-- ============================================================

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select_auth"
  ON public.templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "templates_modify_admin"
  ON public.templates FOR ALL
  USING (get_user_role() IN ('teacher', 'admin'));

-- ============================================================
-- SEARCH LOGS
-- ============================================================

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_logs_insert_own"
  ON public.search_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "search_logs_select_admin"
  ON public.search_logs FOR SELECT
  USING (get_user_role() = 'admin');
