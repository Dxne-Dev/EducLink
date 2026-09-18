'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { grantResourceToPromo } from '@/lib/actions/resources.actions'
import { emitRealtimeRefresh } from '@/lib/realtime-broadcast'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import type { ResourceVisibility } from '@/types/database'

interface ShareFormProps {
  resourceId: string
  availablePromos: { id: string; name: string; year_start?: number; year_end?: number; filieres?: any }[]
}

export function ShareForm({ resourceId, availablePromos }: ShareFormProps) {
  const router = useRouter()
  const [targetPromo, setTargetPromo] = useState('')
  const [shareVisibility, setShareVisibility] = useState<ResourceVisibility>('public')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!targetPromo) {
      setError('Veuillez sélectionner une promotion.')
      return
    }
    startTransition(async () => {
      const res = await grantResourceToPromo(resourceId, targetPromo, shareVisibility)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess('Accès accordé avec succès !')
        setTargetPromo('')
        emitRealtimeRefresh('realtime:resource_promo_access')
        emitRealtimeRefresh('realtime:resources')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="space-y-1.5">
        <Label htmlFor="sf-promo">Promotion cible</Label>
        <Select
          id="sf-promo"
          value={targetPromo}
          onChange={(e) => setTargetPromo(e.target.value)}
          required
        >
          <option value="" disabled>Choisir une promotion</option>
          {availablePromos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.year_start && p.year_end ? ` (${p.year_start}–${p.year_end})` : ''}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sf-visibility">Visibilité pour cette promotion</Label>
        <Select
          id="sf-visibility"
          value={shareVisibility}
          onChange={(e) => setShareVisibility(e.target.value as ResourceVisibility)}
        >
          <option value="public">Publique — visible par tous les étudiants de la promo</option>
          <option value="private">Privée — accès réservé (enseignant + admin)</option>
        </Select>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={pending}>
          Accorder l'accès
        </Button>
      </div>
    </form>
  )
}
