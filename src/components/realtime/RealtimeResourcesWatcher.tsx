'use client'

import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'

/**
 * Composant invisible (render null) qui écoute les changements sur :
 * - la table `resources` (ajout, suppression, modification, visibilité)
 * - la table `resource_promo_access` (partage / révocation entre promos)
 *
 * À chaque événement reçu via WebSocket Supabase Realtime,
 * il déclenche un router.refresh() qui re-fetch le Server Component parent.
 *
 * Usage : insérer <RealtimeResourcesWatcher /> dans n'importe quelle
 * page qui affiche des ressources.
 */
export function RealtimeResourcesWatcher() {
  useRealtimeRefresh('resources', 'realtime:resources')
  useRealtimeRefresh('resource_promo_access', 'realtime:resource_promo_access')
  return null
}
