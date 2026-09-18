'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { revokeResourceFromPromo } from '@/lib/actions/resources.actions'
import { emitRealtimeRefresh } from '@/lib/realtime-broadcast'
import { Trash2 } from 'lucide-react'

interface RevokeButtonProps {
  resourceId: string
  promoId: string
}

export function RevokeButton({ resourceId, promoId }: RevokeButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleRevoke() {
    if (!confirm('Voulez-vous vraiment révoquer l\'accès de cette promotion ?')) return

    startTransition(async () => {
      const res = await revokeResourceFromPromo(resourceId, promoId)
      if (res?.error) {
        alert(res.error)
      } else {
        emitRealtimeRefresh('realtime:resource_promo_access')
        emitRealtimeRefresh('realtime:resources')
        router.refresh()
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleRevoke}
      disabled={pending}
      title="Révoquer l'accès"
      className="inline-flex items-center gap-1 rounded-md p-1.5 text-caption text-ink-muted hover:bg-accent-pink/10 hover:text-accent-pink disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
      <span className="hidden sm:inline">Révoquer</span>
    </button>
  )
}
