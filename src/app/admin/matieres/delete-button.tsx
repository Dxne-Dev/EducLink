'use client'

import { useTransition, useState } from 'react'
import { deleteNiveau, deleteMatiere } from '@/lib/actions/admin.actions'
import { Button } from '@/components/ui/Button'
import { Modal, ModalTitle, ModalDescription } from '@/components/ui/Modal'
import { Trash2 } from 'lucide-react'

export function DeleteButton({ type, id }: { type: 'niveau' | 'matiere'; id: string }) {
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)

  function handleDelete() {
    startTransition(async () => {
      if (type === 'niveau') await deleteNiveau(id)
      else await deleteMatiere(id)
      setConfirm(false)
    })
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setConfirm(true)}>
        <Trash2 className="h-3.5 w-3.5 text-red-500" />
      </Button>
      <Modal open={confirm} onClose={() => setConfirm(false)}>
        <ModalTitle>Supprimer ce {type === 'niveau' ? 'niveau' : 'cette matière'} ?</ModalTitle>
        <ModalDescription>
          Cette action est irréversible et supprimera les éléments associés.
        </ModalDescription>
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
