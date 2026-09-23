'use client'

import { useState } from 'react'
import { createNiveau } from '@/lib/actions/admin.actions'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { toast } from '@/components/ui/Toast'

export function NiveauForm({ filieres }: { filieres: { id: string; name: string }[] }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const res = await createNiveau(formData)
    if (res?.error) {
      setError(res.error)
      toast.error(res.error)
    } else {
      toast.success('Niveau créé avec succès !')
    }
    setPending(false)
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      {error && <Alert variant="danger">{error}</Alert>}
      <div>
        <Label htmlFor="niveau-name">Nom *</Label>
        <Input id="niveau-name" name="name" required placeholder="Ex: L1" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="niveau-filiere">Filière *</Label>
        <Select id="niveau-filiere" name="filiere_id" required className="mt-1">
          <option value="" disabled>Choisir une filière</option>
          {filieres.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="niveau-order">Ordre *</Label>
        <Input id="niveau-order" name="sort_order" type="number" required min={0} className="mt-1" placeholder="1" />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Ajout...' : 'Ajouter le niveau'}
      </Button>
    </form>
  )
}
