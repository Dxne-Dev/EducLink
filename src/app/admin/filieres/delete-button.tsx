'use client'

import { useTransition, useState } from 'react'
import { deleteFiliere } from '@/lib/actions/admin.actions'
import { Button } from '@/components/ui/Button'
import { Modal, ModalTitle, ModalDescription } from '@/components/ui/Modal'
import { Trash2 } from 'lucide-react'

export function DeleteFiliereButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)

  function handleDelete() {
    startTransition(async () => {
      await deleteFiliere(id)
      setConfirm(false)
    })
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setConfirm(true)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
      <Modal open={confirm} onClose={() => setConfirm(false)}>
        <ModalTitle>Supprimer cette filière ?</ModalTitle>
        <ModalDescription>
          Cette action est irréversible. Les niveaux et matières associés seront également supprimés.
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
