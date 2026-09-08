'use client'

import { useState } from 'react'
import { createMatiere } from '@/lib/actions/admin.actions'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export function MatiereForm({ niveaux }: { niveaux: { id: string; name: string }[] }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const res = await createMatiere(formData)
    if (res?.error) setError(res.error)
    setPending(false)
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      {error && <Alert variant="danger">{error}</Alert>}
      <div>
        <Label htmlFor="matiere-name">Nom *</Label>
        <Input id="matiere-name" name="name" required placeholder="Ex: Algorithmique" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="matiere-code">Code</Label>
        <Input id="matiere-code" name="code" placeholder="Ex: ALGO-101" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="matiere-niveau">Niveau *</Label>
        <Select id="matiere-niveau" name="niveau_id" required className="mt-1">
          <option value="" disabled>Choisir un niveau</option>
          {niveaux.map((n) => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Ajout...' : 'Ajouter la matière'}
      </Button>
    </form>
  )
}
