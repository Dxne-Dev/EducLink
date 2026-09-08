'use client'

import { useState, useTransition } from 'react'
import { deleteReport } from '@/lib/actions/internship.actions'
import { Button } from '@/components/ui/Button'
import { Modal, ModalTitle, ModalDescription } from '@/components/ui/Modal'
import { Trash2 } from 'lucide-react'

export function ReportDeleteButton({ reportId }: { reportId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteReport(reportId)
      setConfirm(false)
    })
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setConfirm(true)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
      <Modal open={confirm} onClose={() => setConfirm(false)}>
        <ModalTitle>Supprimer ce rapport ?</ModalTitle>
        <ModalDescription>Le fichier sera également supprimé du stockage. Action irréversible.</ModalDescription>
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
