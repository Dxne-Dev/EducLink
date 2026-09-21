import { createClient } from '@/lib/supabase/client'

let channelCounter = 0

export async function emitRealtimeRefresh(channelName: string = 'realtime:resources') {
  try {
    const supabase = createClient()
    const uniqueName = `${channelName}:${++channelCounter}:${Date.now()}`
    const channel = supabase.channel(uniqueName)
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({ type: 'broadcast', event: 'refresh', payload: { timestamp: Date.now() } })
        setTimeout(() => { supabase.removeChannel(channel) }, 2000)
      }
    })
  } catch (err) {
    console.error('Erreur lors de l\'émission Realtime broadcast:', err)
  }
}
