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
  const routerRef = useRef(router)
  routerRef.current = router

  useEffect(() => {
    const supabase = createClient()

    const ch = supabase
      .channel(channel, {
        config: {
          broadcast: { self: false },
        },
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          routerRef.current.refresh()
        }
      )
      .on(
        'broadcast',
        { event: 'refresh' },
        () => {
          routerRef.current.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, [table, channel])
}