'use client'

import { useTransition, useState } from 'react'
import { deleteNiveau, deleteMatiere } from '@/lib/actions/admin.actions'
import { Button } from '@/components/ui/Button'
import { Modal, ModalTitle, ModalDescription } from '@/components/ui/Modal'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip'
import { toast } from '@/components/ui/Toast'
import { Trash2 } from 'lucide-react'

export function DeleteButton({ type, id }: { type: 'niveau' | 'matiere'; id: string }) {
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)

  function handleDelete() {
    startTransition(async () => {
      const res = type === 'niveau' ? await deleteNiveau(id) : await deleteMatiere(id)
      setConfirm(false)
      if (res?.error) {
        toast.error('Erreur lors de la suppression', res.error)
      } else {
        toast.success(
          type === 'niveau' ? 'Niveau supprimé' : 'Matière supprimée',
          'L\'élément a été supprimé avec succès.'
        )
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
            onClick={() => setConfirm(true)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Supprimer {type === 'niveau' ? 'le niveau' : 'la matière'}</TooltipContent>
      </Tooltip>

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
