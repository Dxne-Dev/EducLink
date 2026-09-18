-- Migration 012 : Activer Supabase Realtime sur les tables de ressources
-- Les tables doivent être ajoutées à la publication "supabase_realtime"
-- pour que les subscriptions Postgres LISTEN/NOTIFY fonctionnent.

-- Activer Realtime sur la table resources
alter publication supabase_realtime add table public.resources;

-- Activer Realtime sur la table resource_promo_access
alter publication supabase_realtime add table public.resource_promo_access;
