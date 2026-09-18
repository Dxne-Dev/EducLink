import { createClient } from '@/lib/supabase/client'

/**
 * Envoie un événement de diffusion (broadcast) en temps réel via Supabase Realtime.
 * Cela permet de notifier TOUS les clients connectés (étudiants, professeurs, admins)
 * même lorsqu'une modification (ex: passage d'un cours en privé) échapperait aux
 * filtres RLS Postgres standard.
 */
export async function emitRealtimeRefresh(channelName: string = 'realtime:resources') {
  try {
    const supabase = createClient()
    const channel = supabase.channel(channelName)
    
    // Si le channel est déjà prêt ou s'abonne pour émettre
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'refresh',
          payload: { timestamp: Date.now() },
        })
      }
    })
  } catch (err) {
    console.error('Erreur lors de l\'émission Realtime broadcast:', err)
  }
}
