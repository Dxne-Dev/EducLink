'use client'

import { useTransition, useState, useEffect } from 'react'
import { setPromotionActive, deletePromotion, updatePromotionLevel } from '@/lib/actions/admin.actions'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal, ModalTitle, ModalDescription } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import { Trash2, ArrowUpRight } from 'lucide-react'

interface PromotionRowData {
  id: string
  name: string
  filiere_id?: string
  niveau_id?: string
  year_start: number
  year_end: number
  is_active: boolean
  filieres?: { name: string; code: string } | null
  niveaux?: { name: string } | null
}

interface NiveauItem {
  id: string
  name: string
  filiere_id: string
}

export function PromotionRow({
  promotion,
  niveaux,
}: {
  promotion: PromotionRowData
  niveaux: NiveauItem[]
}) {
  const [pending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [changeNiveauOpen, setChangeNiveauOpen] = useState(false)
  const [selectedNiveauId, setSelectedNiveauId] = useState(promotion.niveau_id || '')

  useEffect(() => {
    setSelectedNiveauId(promotion.niveau_id || '')
  }, [promotion.niveau_id])

  // Filtrer les niveaux qui appartiennent à la même filière que la promotion
  const promotionFiliereId = promotion.filiere_id
  const filiereNiveaux = promotionFiliereId
    ? niveaux.filter((n) => n.filiere_id === promotionFiliereId)
    : niveaux

  function toggleActive() {
    startTransition(async () => {
      await setPromotionActive(promotion.id, !promotion.is_active)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deletePromotion(promotion.id)
      setConfirmDelete(false)
    })
  }

  function handleUpdateLevel() {
    if (!selectedNiveauId) return
    startTransition(async () => {
      await updatePromotionLevel(promotion.id, selectedNiveauId)
      setChangeNiveauOpen(false)
    })
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 py-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium text-ink">{promotion.name}</p>
          {promotion.is_active ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
        <p className="mt-0.5 text-body-sm text-ink-muted">
          Filière : <span className="font-medium text-ink-secondary">{promotion.filieres?.name}</span> · Niveau actuel : <span className="font-semibold text-primary">{promotion.niveaux?.name}</span> · {promotion.year_start}-{promotion.year_end}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Bouton pour faire progresser ou changer le niveau de la promo */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setChangeNiveauOpen(true)}
          disabled={pending}
          title="Faire progresser le niveau de la promotion"
          className="flex items-center gap-1.5"
        >
          <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
          Passage niveau
        </Button>

        <Button
          variant={promotion.is_active ? 'secondary' : 'primary'}
          size="sm"
          onClick={toggleActive}
          disabled={pending}
        >
          {promotion.is_active ? 'Désactiver' : 'Activer'}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmDelete(true)}
          disabled={pending}
        >
          <Trash2 className="h-4 w-4 text-accent-red" />
        </Button>
      </div>

      {/* Modal Changement de Niveau */}
      <Modal open={changeNiveauOpen} onClose={() => setChangeNiveauOpen(false)}>
        <ModalTitle>Changement de niveau de la promotion</ModalTitle>
        <ModalDescription>
          Faites progresser la promotion {promotion.name} pour la nouvelle année universitaire. Les étudiants inscrits auront automatiquement accès aux matières du nouveau niveau.
        </ModalDescription>
        <div className="mt-4 space-y-3">
          <Label htmlFor="change-niveau-select">Nouveau niveau pour cette promotion</Label>
          <Select
            id="change-niveau-select"
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
    </li>
  )
}
