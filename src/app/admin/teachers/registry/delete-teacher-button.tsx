'use client'

import { useState } from 'react'
import { deleteTeacherFromRegistry } from '@/lib/actions/admin.actions'
import { Button } from '@/components/ui/Button'
import { Trash2 } from 'lucide-react'

export function DeleteTeacherButton({ id, isUsed }: { id: string; isUsed?: boolean }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const msg = isUsed
      ? "Cet enseignant s'est déjà inscrit. Le retirer du registre n'efface pas son compte mais empêche une ré-inscription. Continuer ?"
      : 'Voulez-vous retirer cet enseignant du registre ?'
    if (!confirm(msg)) return
    setLoading(true)
    await deleteTeacherFromRegistry(id)
    setLoading(false)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      loading={loading}
      className="text-danger hover:bg-danger/10 hover:text-danger"
      title="Retirer du registre"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
