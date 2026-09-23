'use client'

import { useState } from 'react'
import { deleteTeacherFromRegistry } from '@/lib/actions/admin.actions'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { toast } from '@/components/ui/Toast'
import { Trash2 } from 'lucide-react'

export function DeleteTeacherButton({ id, isUsed }: { id: string; isUsed?: boolean }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const msg = isUsed
      ? "Cet enseignant s'est déjà inscrit. Le retirer du registre n'efface pas son compte mais empêche une ré-inscription. Continuer ?"
      : 'Voulez-vous retirer cet enseignant du registre ?'
    if (!confirm(msg)) return
    setLoading(true)
    const res = await deleteTeacherFromRegistry(id)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Enseignant retiré du registre')
    }
    setLoading(false)
  }

  return (
    <Tooltip content="Retirer du registre">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        loading={loading}
        className="h-8 w-8 p-0 text-accent-pink hover:bg-accent-pink/10 hover:text-accent-pink"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </Tooltip>
  )
}
