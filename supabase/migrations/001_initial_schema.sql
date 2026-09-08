-- ============================================================
-- EDULINK / MEMORYSCHOOL - DATABASE SCHEMA
-- Supabase PostgreSQL Migration
-- ============================================================

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

CREATE TYPE resource_type AS ENUM (
  'cours', 'tp', 'examen', 'td', 'fiche', 'autre'
);

CREATE TYPE document_status AS ENUM (
  'draft', 'submitted', 'validated', 'archived'
);

-- ============================================================
-- TABLE: filieres (Programs of Study)
-- ============================================================

CREATE TABLE public.filieres (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  code        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.filieres IS 'Academic programs (e.g., Informatique, GEII)';

-- ============================================================
-- TABLE: niveaux (Levels within a Filiere)
-- ============================================================

CREATE TABLE public.niveaux (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filiere_id  UUID NOT NULL REFERENCES public.filieres(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(filiere_id, name)
);

-- ============================================================
-- TABLE: matieres (Subjects within a Niveau)
-- ============================================================

CREATE TABLE public.matieres (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  niveau_id   UUID NOT NULL REFERENCES public.niveaux(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  code        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(niveau_id, name)
);

-- ============================================================
-- TABLE: promotions (Academic Year / Cohort)
-- ============================================================

CREATE TABLE public.promotions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filiere_id  UUID NOT NULL REFERENCES public.filieres(id) ON DELETE CASCADE,
  niveau_id   UUID NOT NULL REFERENCES public.niveaux(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  year_start  INT NOT NULL,
  year_end    INT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(filiere_id, niveau_id, name)
);

-- ============================================================
-- TABLE: profiles (User profiles, linked to auth.users)
-- ============================================================

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'student',
  avatar_url  TEXT,
  promo_id    UUID REFERENCES public.promotions(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles synced from auth.users via trigger';

-- ============================================================
-- TABLE: enrollments (Students <-> Promotions M:N)
-- ============================================================

CREATE TABLE public.enrollments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, promotion_id)
);

-- ============================================================
-- TABLE: resources (Pedagogical Resources)
-- ============================================================

CREATE TABLE public.resources (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  description  TEXT,
  type         resource_type NOT NULL DEFAULT 'cours',
  matiere_id   UUID NOT NULL REFERENCES public.matieres(id) ON DELETE CASCADE,
  promo_id     UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  uploaded_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       document_status NOT NULL DEFAULT 'draft',
  file_path    TEXT NOT NULL,
  file_size    BIGINT,
  mime_type    TEXT,
  version      INT NOT NULL DEFAULT 1,
  is_anonymized BOOLEAN NOT NULL DEFAULT false,
  tags         TEXT[] DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.resources IS 'Pedagogical resources: courses, TPs, exams, etc.';

CREATE INDEX idx_resources_matiere ON public.resources(matiere_id);
CREATE INDEX idx_resources_promo ON public.resources(promo_id);
CREATE INDEX idx_resources_type ON public.resources(type);
CREATE INDEX idx_resources_status ON public.resources(status);
CREATE INDEX idx_resources_tags ON public.resources USING gin(tags);

-- ============================================================
-- TABLE: resource_versions (Version History)
-- ============================================================

CREATE TABLE public.resource_versions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id  UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  version      INT NOT NULL,
  file_path    TEXT NOT NULL,
  file_size    BIGINT,
  notes        TEXT,
  created_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(resource_id, version)
);

-- ============================================================
-- TABLE: resource_duplications (Audit trail for folder copies)
-- ============================================================

CREATE TABLE public.resource_duplications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_promo_id   UUID NOT NULL REFERENCES public.promotions(id),
  target_promo_id   UUID NOT NULL REFERENCES public.promotions(id),
  resource_count    INT NOT NULL DEFAULT 0,
  duplicated_by     UUID NOT NULL REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: internships (Internship Records)
-- ============================================================

CREATE TABLE public.internships (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  promo_id        UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  company_name    TEXT NOT NULL,
  company_address TEXT,
  tutor_name      TEXT,
  tutor_email     TEXT,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  subject         TEXT NOT NULL,
  status          document_status NOT NULL DEFAULT 'draft',
  grade           NUMERIC(4,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: internship_reports (Report Files & Archive)
-- ============================================================

CREATE TABLE public.internship_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  internship_id   UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  file_path       TEXT NOT NULL,
  file_size       BIGINT,
  mime_type       TEXT,
  is_validated    BOOLEAN NOT NULL DEFAULT false,
  is_anonymized   BOOLEAN NOT NULL DEFAULT false,
  validated_by    UUID REFERENCES public.profiles(id),
  validated_at    TIMESTAMPTZ,
  auto_archived   BOOLEAN NOT NULL DEFAULT false,
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_internship_reports_validated ON public.internship_reports(is_validated);
CREATE INDEX idx_internship_reports_archived ON public.internship_reports(auto_archived);

-- ============================================================
-- TABLE: templates (Document Templates)
-- ============================================================

CREATE TABLE public.templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL,
  file_path   TEXT NOT NULL,
  file_size   BIGINT,
  mime_type   TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: search_logs (Search Analytics)
-- ============================================================

CREATE TABLE public.search_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES public.profiles(id),
  query_text   TEXT NOT NULL,
  filters      JSONB,
  result_count INT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: Auto-update updated_at column
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_internships_updated_at
  BEFORE UPDATE ON public.internships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
