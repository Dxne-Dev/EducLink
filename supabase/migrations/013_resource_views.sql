-- ============================================================
-- MIGRATION 013 : Resource Views & Consultation Tracking
-- ============================================================

-- Table de suivi des vues/téléchargements de ressources
CREATE TABLE public.resource_views (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id  UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action       TEXT NOT NULL DEFAULT 'view',
  ip_addr      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resource_views_resource ON public.resource_views(resource_id);
CREATE INDEX idx_resource_views_user ON public.resource_views(user_id);
CREATE INDEX idx_resource_views_created ON public.resource_views(created_at);
CREATE INDEX idx_resource_views_action ON public.resource_views(action);

-- RLS : tout le monde peut lire (pour les stats publiques)
ALTER TABLE public.resource_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permettre la lecture des vues"
  ON public.resource_views
  FOR SELECT
  USING (true);

CREATE POLICY "Permettre l'insertion de vues"
  ON public.resource_views
  FOR INSERT
  WITH CHECK (true);

-- Fonction RPC pour logger une vue
CREATE OR REPLACE FUNCTION public.log_resource_view(
  p_resource_id UUID,
  p_action TEXT DEFAULT 'view'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.resource_views (resource_id, user_id, action, ip_addr)
  VALUES (
    p_resource_id,
    auth.uid(),
    p_action,
    COALESCE(current_setting('request.headers', true) ->> 'x-forwarded-for', 'unknown')
  );
END;
$$;