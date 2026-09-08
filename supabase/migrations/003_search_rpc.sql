-- ============================================================
-- SEARCH FUNCTION (called by Edge Function or RPC)
-- ============================================================

CREATE OR REPLACE FUNCTION public.search_resources(
  p_query     TEXT DEFAULT NULL,
  p_type      resource_type DEFAULT NULL,
  p_year      INT DEFAULT NULL,
  p_teacher   UUID DEFAULT NULL,
  p_filiere   UUID DEFAULT NULL,
  p_matiere   UUID DEFAULT NULL,
  p_limit     INT DEFAULT 20,
  p_offset    INT DEFAULT 0
)
RETURNS TABLE (
  id           UUID,
  title        TEXT,
  description  TEXT,
  type         resource_type,
  file_path    TEXT,
  file_size    BIGINT,
  mime_type    TEXT,
  version      INT,
  created_at   TIMESTAMPTZ,
  matiere_name TEXT,
  filiere_name TEXT,
  promo_name   TEXT,
  uploader     TEXT,
  rank         REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
    r.type,
    r.file_path,
    r.file_size,
    r.mime_type,
    r.version,
    r.created_at,
    m.name AS matiere_name,
    f.name AS filiere_name,
    pr.name AS promo_name,
    p.full_name AS uploader,
    CASE
      WHEN p_query IS NOT NULL THEN
        ts_rank(
          to_tsvector('french', coalesce(r.title, '') || ' ' || coalesce(r.description, '')),
          plainto_tsquery('french', p_query)
        )
      ELSE 1.0
    END AS rank
  FROM public.resources r
  JOIN public.matieres m ON m.id = r.matiere_id
  JOIN public.niveaux n ON n.id = m.niveau_id
  JOIN public.filieres f ON f.id = n.filiere_id
  JOIN public.promotions pr ON pr.id = r.promo_id
  JOIN public.profiles p ON p.id = r.uploaded_by
  WHERE r.status IN ('validated', 'archived')
    AND (p_query IS NULL OR to_tsvector('french', coalesce(r.title, '') || ' ' || coalesce(r.description, '')) @@ plainto_tsquery('french', p_query))
    AND (p_type IS NULL OR r.type = p_type)
    AND (p_year IS NULL OR pr.year_start = p_year)
    AND (p_teacher IS NULL OR r.uploaded_by = p_teacher)
    AND (p_filiere IS NULL OR f.id = p_filiere)
    AND (p_matiere IS NULL OR r.matiere_id = p_matiere)
  ORDER BY rank DESC, r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- DUPLICATE RESOURCES FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.duplicate_resources(
  p_source_promo UUID,
  p_target_promo UUID
)
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_resource RECORD;
BEGIN
  IF public.get_user_role() NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  FOR v_resource IN
    SELECT * FROM public.resources
    WHERE promo_id = p_source_promo
      AND status IN ('validated', 'archived')
  LOOP
    INSERT INTO public.resources (
      title, description, type, matiere_id, promo_id,
      uploaded_by, status, file_path, file_size, mime_type,
      version, tags
    ) VALUES (
      v_resource.title, v_resource.description, v_resource.type,
      v_resource.matiere_id, p_target_promo,
      auth.uid(), 'draft', v_resource.file_path, v_resource.file_size,
      v_resource.mime_type, 1, v_resource.tags
    );
    v_count := v_count + 1;
  END LOOP;

  INSERT INTO public.resource_duplications (
    source_promo_id, target_promo_id, resource_count, duplicated_by
  ) VALUES (
    p_source_promo, p_target_promo, v_count, auth.uid()
  );

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
