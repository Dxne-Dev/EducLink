'use client'

import { useState, useTransition, useEffect } from 'react'
import { assignTeacherMatieres } from '@/lib/actions/admin.actions'
import { Modal, ModalTitle, ModalDescription } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { BookMarked, Check, GraduationCap } from 'lucide-react'

interface MatiereItem {
  id: string
  name: string
  code?: string | null
  niveau_id: string
  niveaux?: {
    name: string
    filiere_id: string
    filieres?: {
      name: string
      code: string
    } | null
  } | null
}

interface FiliereItem {
  id: string
  name: string
  code?: string
}

interface AssignMatieresModalProps {
  teacher: {
    id: string // registry_id ou profile_id
    full_name: string
    email: string
    profile_id?: string | null
  }
  assignedMatiereIds: string[]
  allMatieres: MatiereItem[]
  filieres: FiliereItem[]
}

export function AssignMatieresModal({
  teacher,
  assignedMatiereIds,
  allMatieres,
  filieres,
}: AssignMatieresModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>(assignedMatiereIds)
  const [pending, startTransition] = useTransition()
  const [filterFiliere, setFilterFiliere] = useState<string>('all')

  useEffect(() => {
    setSelectedIds(assignedMatiereIds)
  }, [assignedMatiereIds, open])

  function toggleMatiere(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    )
  }

  function handleSave() {
    startTransition(async () => {
      await assignTeacherMatieres(
        {
          teacher_id: teacher.profile_id || undefined,
          teacher_registry_id: teacher.id,
        },
        selectedIds
      )
      setOpen(false)
    })
  }

  // Filtrer les matières à afficher dans le modal
  const displayedMatieres = allMatieres.filter((m) => {
    if (filterFiliere === 'all') return true
    return m.niveaux?.filiere_id === filterFiliere
  })

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setSelectedIds(assignedMatiereIds)
          setOpen(true)
        }}
        className="flex items-center gap-1.5"
      >
        <BookMarked className="h-3.5 w-3.5 text-accent-teal" />
        Affecter matières ({assignedMatiereIds.length})
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} className="max-w-2xl">
        <ModalTitle>Affectation des matières — {teacher.full_name}</ModalTitle>
        <ModalDescription>
          Sélectionnez les matières que cet enseignant dispense. Un enseignant peut enseigner sur plusieurs niveaux et plusieurs filières.
        </ModalDescription>

        {/* Filtre par filière dans le modal */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-hairline pb-3">
          <span className="text-caption font-medium text-ink-muted">Filière :</span>
          <button
            type="button"
            onClick={() => setFilterFiliere('all')}
            className={`rounded-full px-2.5 py-1 text-caption transition-colors ${
              filterFiliere === 'all'
                ? 'bg-primary text-white font-medium'
                : 'bg-canvas-soft text-ink-muted hover:text-ink'
            }`}
          >
            Toutes
          </button>
          {filieres.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterFiliere(f.id)}
              className={`rounded-full px-2.5 py-1 text-caption transition-colors ${
                filterFiliere === f.id
                  ? 'bg-primary text-white font-medium'
                  : 'bg-canvas-soft text-ink-muted hover:text-ink'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>

        {/* Liste des matières avec checkboxes stylisées */}
        <div className="mt-4 max-h-80 overflow-y-auto space-y-2 pr-1">
          {displayedMatieres.length === 0 ? (
            <p className="py-6 text-center text-body-sm text-ink-muted">
              Aucune matière trouvée pour cette sélection.
            </p>
          ) : (
            displayedMatieres.map((m) => {
              const isSelected = selectedIds.includes(m.id)
              const filiereName = m.niveaux?.filieres?.name ?? ''
              const niveauName = m.niveaux?.name ?? ''

              return (
                <div
                  key={m.id}
                  onClick={() => toggleMatiere(m.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5 text-ink'
                      : 'border-hairline bg-white hover:bg-canvas-soft text-ink-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid size-5 place-content-center rounded border transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-white'
                          : 'border-hairline bg-white'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="font-medium text-ink text-body-sm flex items-center gap-2">
                        {m.name}
                        {m.code && (
                          <span className="text-caption text-ink-faint">({m.code})</span>
                        )}
                      </p>
                      <p className="text-caption text-ink-muted flex items-center gap-1.5 mt-0.5">
                        <GraduationCap className="h-3 w-3" />
                        {filiereName} · <span className="font-semibold text-primary">{niveauName}</span>
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <Badge variant="purple" className="text-[10px]">Affectée</Badge>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Boutons d'action */}
        <div className="mt-6 flex items-center justify-between border-t border-hairline pt-4">
          <span className="text-caption text-ink-muted">
            {selectedIds.length} matière{selectedIds.length > 1 ? 's' : ''} sélectionnée{selectedIds.length > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={pending}>
              {pending ? 'Enregistrement...' : 'Valider les affectations'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
