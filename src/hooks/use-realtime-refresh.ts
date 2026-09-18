'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook générique qui s'abonne à une table Supabase via Realtime et
 * appelle router.refresh() à chaque INSERT / UPDATE / DELETE.
 * Cela re-exécute le Server Component parent sans rechargement complet.
 *
 * @param table   - Nom de la table Supabase à écouter
 * @param channel - Identifiant unique du channel (évite les doublons)
 */
export function useRealtimeRefresh(table: string, channel: string) {
  const router = useRouter()
  // On garde une ref stable pour éviter de re-créer l'abonnement à chaque render
  const routerRef = useRef(router)
  routerRef.current = router

  useEffect(() => {
    const supabase = createClient()

    const sub = supabase
      .channel(channel, {
        config: {
          broadcast: { self: false },
        },
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          // Re-fetch le Server Component parent (sans full page reload)
          routerRef.current.refresh()
        }
      )
      .on(
        'broadcast',
        { event: 'refresh' },
        () => {
          // Reçu lors d'un broadcast explicite (ex: passage en privé, suppression)
          routerRef.current.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [table, channel]) // stable — ne change jamais après le montage
}
