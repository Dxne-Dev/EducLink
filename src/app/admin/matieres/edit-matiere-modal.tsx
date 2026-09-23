'use client'

import { useState, useTransition } from 'react'
import { updateMatiere } from '@/lib/actions/admin.actions'
import { Button } from '@/components/ui/Button'
import { Modal, ModalTitle, ModalDescription } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { Pencil } from 'lucide-react'

interface MatiereItem {
  id: string
  name: string
  code?: string | null
  niveau_id: string
}

interface NiveauItem {
  id: string
  name: string
  filiere_id: string
}

interface FiliereItem {
  id: string
  name: string
  code?: string
}

export function EditMatiereModal({
  matiere,
  niveaux,
  filieres,
}: {
  matiere: MatiereItem
  niveaux: NiveauItem[]
  filieres: FiliereItem[]
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(matiere.name)
  const [code, setCode] = useState(matiere.code || '')
  const [niveauId, setNiveauId] = useState(matiere.niveau_id)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const filiereMap = new Map(filieres.map((f) => [f.id, f.name]))

  function handleOpen() {
    setName(matiere.name)
    setCode(matiere.code || '')
    setNiveauId(matiere.niveau_id)
    setError(null)
    setOpen(true)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !niveauId) {
      setError('Nom et niveau sont requis')
      return
    }

    startTransition(async () => {
      setError(null)
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('niveau_id', niveauId)
      if (code.trim()) {
        formData.append('code', code.trim())
      }

      const res = await updateMatiere(matiere.id, formData)
      if (res?.error) {
        setError(res.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        title="Modifier la matière"
        className="h-8 w-8 p-0 text-ink-muted hover:text-ink hover:bg-canvas-soft"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalTitle>Modifier la matière</ModalTitle>
        <ModalDescription>
          Mettez à jour le nom, code ou niveau de rattachement de {matiere.name}.
        </ModalDescription>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}

          <div>
            <Label htmlFor={`edit-matiere-name-${matiere.id}`}>Nom de la matière *</Label>
            <Input
              id={`edit-matiere-name-${matiere.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor={`edit-matiere-code-${matiere.id}`}>Code matière</Label>
            <Input
              id={`edit-matiere-code-${matiere.id}`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: ALGO-101"
              className="mt-1 font-mono uppercase"
            />
          </div>

          <div>
            <Label htmlFor={`edit-matiere-niveau-${matiere.id}`}>Niveau & Filière *</Label>
            <Select
              id={`edit-matiere-niveau-${matiere.id}`}
              value={niveauId}
              onChange={(e) => setNiveauId(e.target.value)}
              required
              className="mt-1"
            >
              <option value="" disabled>Sélectionner un niveau</option>
              {niveaux.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} — {filiereMap.get(n.filiere_id) ?? 'Filière'}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
