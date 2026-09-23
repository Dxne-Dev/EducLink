'use client'

import { useTransition, useState, useEffect } from 'react'
import { setPromotionActive, deletePromotion, updatePromotionLevel } from '@/lib/actions/admin.actions'
import { Button } from '@/components/ui/Button'
import { Modal, ModalTitle, ModalDescription } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import { Tooltip } from '@/components/ui/Tooltip'
import { toast } from '@/components/ui/Toast'
import { Trash2, ArrowUpRight } from 'lucide-react'

interface PromotionItem {
  id: string
  name: string
  filiere_id?: string
  niveau_id?: string
  year_start: number
  year_end: number
  is_active: boolean
}

interface NiveauItem {
  id: string
  name: string
  filiere_id: string
}

export function PromotionActions({
  promotion,
  niveaux,
}: {
  promotion: PromotionItem
  niveaux: NiveauItem[]
}) {
  const [pending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [changeNiveauOpen, setChangeNiveauOpen] = useState(false)
  const [selectedNiveauId, setSelectedNiveauId] = useState(promotion.niveau_id || '')

  useEffect(() => {
    setSelectedNiveauId(promotion.niveau_id || '')
  }, [promotion.niveau_id])

  const filiereNiveaux = promotion.filiere_id
    ? niveaux.filter((n) => n.filiere_id === promotion.filiere_id)
    : niveaux

  function toggleActive() {
    startTransition(async () => {
      const nextState = !promotion.is_active
      await setPromotionActive(promotion.id, nextState)
      if (nextState) {
        toast.success(`Promotion "${promotion.name}" activée`)
      } else {
        toast.info(`Promotion "${promotion.name}" désactivée`)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deletePromotion(promotion.id)
      setConfirmDelete(false)
      toast.success(`Promotion "${promotion.name}" supprimée`)
    })
  }

  function handleUpdateLevel() {
    if (!selectedNiveauId) return
    startTransition(async () => {
      await updatePromotionLevel(promotion.id, selectedNiveauId)
      setChangeNiveauOpen(false)
      toast.success(`Passage de niveau effectué pour "${promotion.name}"`)
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Passage niveau */}
      <Tooltip content="Faire progresser le niveau de la promotion">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setChangeNiveauOpen(true)}
          disabled={pending}
          className="h-8 px-2 text-caption flex items-center gap-1"
        >
          <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">Passage niveau</span>
        </Button>
      </Tooltip>

      {/* Activer / Désactiver */}
      <Tooltip content={promotion.is_active ? 'Désactiver la promotion' : 'Activer la promotion'}>
        <Button
          variant={promotion.is_active ? 'secondary' : 'primary'}
          size="sm"
          onClick={toggleActive}
          disabled={pending}
          className="h-8 px-2.5 text-caption"
        >
          {promotion.is_active ? 'Désactiver' : 'Activer'}
        </Button>
      </Tooltip>

      {/* Supprimer */}
      <Tooltip content="Supprimer la promotion">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmDelete(true)}
          disabled={pending}
          className="h-8 w-8 p-0 text-ink-muted hover:text-accent-pink hover:bg-canvas-soft"
        >
          <Trash2 className="h-3.5 w-3.5 text-accent-pink" />
        </Button>
      </Tooltip>

      {/* Modal Changement de Niveau */}
      <Modal open={changeNiveauOpen} onClose={() => setChangeNiveauOpen(false)}>
        <ModalTitle>Changement de niveau de la promotion</ModalTitle>
        <ModalDescription>
          Faites progresser la promotion {promotion.name} pour la nouvelle année universitaire. Les étudiants inscrits auront automatiquement accès aux matières du nouveau niveau.
        </ModalDescription>
        <div className="mt-4 space-y-3">
          <Label htmlFor={`change-niveau-${promotion.id}`}>Nouveau niveau pour cette promotion</Label>
          <Select
            id={`change-niveau-${promotion.id}`}
            value={selectedNiveauId}
            onChange={(e) => setSelectedNiveauId(e.target.value)}
          >
            <option value="" disabled>Sélectionner un niveau</option>
            {filiereNiveaux.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setChangeNiveauOpen(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateLevel}
            disabled={pending || !selectedNiveauId || selectedNiveauId === promotion.niveau_id}
          >
            {pending ? 'Mise à jour...' : 'Appliquer le passage'}
          </Button>
        </div>
      </Modal>

      {/* Modal Confirmation Suppression */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <ModalTitle>Supprimer cette promotion ?</ModalTitle>
        <ModalDescription>
          Cette action est irréversible et supprimera les accès liés aux étudiants de cette promotion.
        </ModalDescription>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={pending}>
            {pending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
