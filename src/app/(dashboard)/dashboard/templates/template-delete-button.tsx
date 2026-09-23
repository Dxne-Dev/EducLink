'use client'

import { useState, useTransition } from 'react'
import { deleteTemplate } from '@/lib/actions/template.actions'
import { Button } from '@/components/ui/Button'
import { Modal, ModalTitle, ModalDescription } from '@/components/ui/Modal'
import { Tooltip } from '@/components/ui/Tooltip'
import { toast } from '@/components/ui/Toast'
import { Trash2 } from 'lucide-react'

export function TemplateDeleteButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteTemplate(id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Modèle supprimé avec succès')
      }
      setConfirm(false)
    })
  }

  return (
    <>
      <Tooltip content="Supprimer le modèle">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirm(true)}
          className="h-8 w-8 p-0 text-accent-pink hover:bg-accent-pink/10 hover:text-accent-pink"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </Tooltip>
      <Modal open={confirm} onClose={() => setConfirm(false)}>
        <ModalTitle>Supprimer ce modèle ?</ModalTitle>
        <ModalDescription>Le fichier sera également supprimé. Action irréversible.</ModalDescription>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirm(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} disabled={pending}>
            {pending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
