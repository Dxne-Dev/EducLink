'use client'

import { useTransition, useState } from 'react'
import { setPromotionActive, deletePromotion } from '@/lib/actions/admin.actions'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal, ModalTitle, ModalDescription } from '@/components/ui/Modal'
import { Trash2 } from 'lucide-react'

interface PromotionRowData {
  id: string
  name: string
  year_start: number
  year_end: number
  is_active: boolean
  filieres?: { name: string; code: string } | null
  niveaux?: { name: string } | null
}

export function PromotionRow({ promotion }: { promotion: PromotionRowData }) {
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)

  function toggleActive() {
    startTransition(async () => {
      await setPromotionActive(promotion.id, !promotion.is_active)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deletePromotion(promotion.id)
      setConfirm(false)
    })
  }

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 dark:text-white">{promotion.name}</p>
          {promotion.is_active ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {promotion.filieres?.name} · {promotion.niveaux?.name} · {promotion.year_start}-{promotion.year_end}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant={promotion.is_active ? 'secondary' : 'primary'} size="sm" onClick={toggleActive} disabled={pending}>
          {promotion.is_active ? 'Désactiver' : 'Activer'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirm(true)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)}>
        <ModalTitle>Supprimer cette promotion ?</ModalTitle>
        <ModalDescription>
          Cette action est irréversible et supprimera les ressources liées.
        </ModalDescription>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirm(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} disabled={pending}>
            {pending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </Modal>
    </li>
  )
}
