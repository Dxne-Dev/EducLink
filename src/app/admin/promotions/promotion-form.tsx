'use client'

import { useState } from 'react'
import { createPromotion } from '@/lib/actions/admin.actions'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { toast } from '@/components/ui/Toast'

interface Filiere { id: string; name: string }
interface Niveau { id: string; name: string; filiere_id: string }

export function PromotionForm({
  filieres,
  niveaux,
}: {
  filieres: Filiere[]
  niveaux: Niveau[]
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [filiereId, setFiliereId] = useState('')

  const filteredNiveaux = filiereId
    ? niveaux.filter((n) => n.filiere_id === filiereId)
    : niveaux

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const res = await createPromotion(formData)
    if (res?.error) {
      setError(res.error)
      toast.error(res.error)
    } else {
      toast.success('Promotion créée avec succès !')
    }
    setPending(false)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && <Alert variant="danger">{error}</Alert>}
      <div>
        <Label htmlFor="name">Nom *</Label>
        <Input id="name" name="name" required placeholder="Ex: Licence 1 Informatique" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="filiere_id">Filière *</Label>
        <Select
          id="filiere_id"
          name="filiere_id"
          required
          className="mt-1"
          value={filiereId}
          onChange={(e) => setFiliereId(e.target.value)}
        >
          <option value="" disabled>Choisir une filière</option>
          {filieres.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="niveau_id">Niveau *</Label>
        <Select id="niveau_id" name="niveau_id" required className="mt-1">
          <option value="" disabled>Choisir un niveau</option>
          {filteredNiveaux.map((n) => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="year_start">Année début *</Label>
          <Input id="year_start" name="year_start" type="number" required min={2020} max={2030} className="mt-1" placeholder="2025" />
        </div>
        <div>
          <Label htmlFor="year_end">Année fin *</Label>
          <Input id="year_end" name="year_end" type="number" required min={2020} max={2030} className="mt-1" placeholder="2026" />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Création...' : 'Créer la promotion'}
      </Button>
    </form>
  )
}
