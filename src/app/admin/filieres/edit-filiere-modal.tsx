'use client'

import { useState, useTransition } from 'react'
import { updateFiliere } from '@/lib/actions/admin.actions'
import { Button } from '@/components/ui/Button'
import { Modal, ModalTitle, ModalDescription } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Alert } from '@/components/ui/Alert'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip'
import { toast } from '@/components/ui/Toast'
import { Pencil } from 'lucide-react'

interface FiliereItem {
  id: string
  name: string
  code: string
  description?: string | null
}

export function EditFiliereModal({ filiere }: { filiere: FiliereItem }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(filiere.name)
  const [code, setCode] = useState(filiere.code)
  const [description, setDescription] = useState(filiere.description || '')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleOpen() {
    setName(filiere.name)
    setCode(filiere.code)
    setDescription(filiere.description || '')
    setError(null)
    setOpen(true)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !code.trim()) {
      setError('Nom et code sont requis')
      return
    }

    startTransition(async () => {
      setError(null)
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('code', code.trim())
      if (description.trim()) {
        formData.append('description', description.trim())
      }

      const res = await updateFiliere(filiere.id, formData)
      if (res?.error) {
        setError(res.error)
        toast.error('Erreur de mise à jour', res.error)
      } else {
        toast.success('Filière mise à jour', `La filière ${name} a été modifiée avec succès.`)
        setOpen(false)
      }
    })
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpen}
            className="h-8 w-8 p-0 text-ink-muted hover:text-ink hover:bg-canvas-soft dark:hover:bg-slate-800"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Modifier la filière</TooltipContent>
      </Tooltip>

      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalTitle>Modifier la filière</ModalTitle>
        <ModalDescription>
          Mettez à jour les informations de la filière {filiere.name}.
        </ModalDescription>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}

          <div>
            <Label htmlFor={`edit-filiere-name-${filiere.id}`}>Nom *</Label>
            <Input
              id={`edit-filiere-name-${filiere.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor={`edit-filiere-code-${filiere.id}`}>Code *</Label>
            <Input
              id={`edit-filiere-code-${filiere.id}`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="mt-1 font-mono uppercase"
            />
          </div>

          <div>
            <Label htmlFor={`edit-filiere-desc-${filiere.id}`}>Description</Label>
            <textarea
              id={`edit-filiere-desc-${filiere.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-xl border border-hairline bg-white px-3 py-2 text-body-sm text-ink shadow-2xs placeholder:text-ink-faint focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
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
