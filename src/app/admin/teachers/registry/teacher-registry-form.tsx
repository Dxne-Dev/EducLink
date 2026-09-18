'use client'

import { useState } from 'react'
import { addTeacherToRegistry } from '@/lib/actions/admin.actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'

export function TeacherRegistryForm({
  filieres,
}: {
  filieres: { id: string; name: string; code: string }[]
}) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const form = e.currentTarget
    const fd = new FormData(form)
    const res = await addTeacherToRegistry(fd)

    if (res?.error) {
      setError(res.error)
      setLoading(false)
      return
    }

    form.reset()
    setSuccess(true)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Enseignant ajouté au registre avec succès !</Alert>}

      <div className="space-y-1.5">
        <Label htmlFor="full_name">Nom & Prénom *</Label>
        <Input id="full_name" name="full_name" required placeholder="Ex: Dr. Martin Dubois" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email institutionnel *</Label>
        <Input id="email" name="email" type="email" required placeholder="m.dubois@univ.edu" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="employee_id">Matricule / Identifiant enseignant</Label>
        <Input id="employee_id" name="employee_id" placeholder="Ex: ENS-2024-008" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filiere_id">Filière de rattachement</Label>
        <Select id="filiere_id" name="filiere_id" defaultValue="">
          <option value="">Toutes les filières / Transversal</option>
          {filieres.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.code})
            </option>
          ))}
        </Select>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        {loading ? 'Enregistrement...' : 'Ajouter au registre'}
      </Button>
    </form>
  )
}
