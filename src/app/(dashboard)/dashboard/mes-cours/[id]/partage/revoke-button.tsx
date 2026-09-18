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
    if (!confirm('Révoquer cet accès ? Les étudiants de cette promotion ne pourront plus accéder au document.')) return
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
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-caption text-accent-pink transition-colors hover:bg-accent-pink/10 disabled:opacity-60"
      title="Révoquer l'accès"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? '...' : 'Révoquer'}
    </button>
  )
}
