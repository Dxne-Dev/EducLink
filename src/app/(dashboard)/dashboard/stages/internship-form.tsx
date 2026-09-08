'use client'

import { useState } from 'react'
import { createInternship } from '@/lib/actions/internship.actions'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export function InternshipForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const res = await createInternship(formData)
    if (res?.error) setError(res.error)
    setPending(false)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="company_name">Entreprise *</Label>
          <Input id="company_name" name="company_name" required placeholder="Ex: Société XYZ" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="company_address">Adresse</Label>
          <Input id="company_address" name="company_address" placeholder="Ville, adresse" className="mt-1" />
        </div>
      </div>
      <div>
        <Label htmlFor="subject">Sujet du stage *</Label>
        <Input id="subject" name="subject" required placeholder="Ex: Développement d'une application web" className="mt-1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="start_date">Date de début *</Label>
          <Input id="start_date" name="start_date" type="date" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="end_date">Date de fin *</Label>
          <Input id="end_date" name="end_date" type="date" required className="mt-1" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="tutor_name">Maître de stage</Label>
          <Input id="tutor_name" name="tutor_name" placeholder="Nom du tuteur" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="tutor_email">Email du tuteur</Label>
          <Input id="tutor_email" name="tutor_email" type="email" placeholder="tuteur@email.com" className="mt-1" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Enregistrement...' : 'Déclarer mon stage'}
      </Button>
    </form>
  )
}
