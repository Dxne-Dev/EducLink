'use client'

import { useState, useTransition, useEffect } from 'react'
import { setResourceVisibility } from '@/lib/actions/resources.actions'
import { emitRealtimeRefresh } from '@/lib/realtime-broadcast'
import { Globe, Lock } from 'lucide-react'
import type { ResourceVisibility } from '@/types/database'
import { cn } from '@/lib/utils'

interface VisibilityToggleButtonProps {
  resourceId: string
  currentVisibility: ResourceVisibility
}

export function VisibilityToggleButton({ resourceId, currentVisibility }: VisibilityToggleButtonProps) {
  const [visibility, setVisibility] = useState<ResourceVisibility>(currentVisibility)
  const [pending, startTransition] = useTransition()

  // Synchronise l'état local quand les données serveur changent
  // (ex: après router.refresh() déclenché par Supabase Realtime)
  useEffect(() => {
    setVisibility(currentVisibility)
  }, [currentVisibility])

  function handleToggle() {
    const next: ResourceVisibility = visibility === 'public' ? 'private' : 'public'
    startTransition(async () => {
      const res = await setResourceVisibility(resourceId, next)
      if (!res?.error) {
        setVisibility(next)
        emitRealtimeRefresh('realtime:resources')
      }
    })
  }

  const isPublic = visibility === 'public'

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      title={isPublic ? 'Rendre privé' : 'Rendre public'}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-eyebrow font-medium transition-all',
        pending && 'opacity-60',
        isPublic
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'border-hairline bg-canvas-soft text-ink-muted hover:bg-canvas-base hover:text-ink'
      )}
    >
      {isPublic ? (
        <>
          <Globe className="h-3 w-3" />
          Public
        </>
      ) : (
        <>
          <Lock className="h-3 w-3" />
          Privé
        </>
      )}
    </button>
  )
}
