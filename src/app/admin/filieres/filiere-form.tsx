'use client'

import { useState } from 'react'
import { createFiliere } from '@/lib/actions/admin.actions'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Plus } from 'lucide-react'

export function FiliereForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setSuccess(null)

    if (!name.trim() || !code.trim()) {
      setError('Nom et code sont requis')
      setPending(false)
      return
    }

    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('code', code.trim())
    if (description.trim()) {
      formData.append('description', description.trim())
    }

    const res = await createFiliere(formData)

    if (res?.error) {
      setError(res.error)
    } else {
      setSuccess('Filière créée avec succès !')
      setName('')
      setCode('')
      setDescription('')
    }
    setPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div>
        <Label htmlFor="filiere-name">Nom de la filière *</Label>
        <Input
          id="filiere-name"
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setSuccess(null)
          }}
          required
          placeholder="Ex: Informatique & Réseaux"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="filiere-code">Code court *</Label>
        <Input
          id="filiere-code"
          name="code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setSuccess(null)
          }}
          required
          placeholder="Ex: INFO"
          className="mt-1 font-mono uppercase"
        />
      </div>

      <div>
        <Label htmlFor="filiere-description">Description</Label>
        <textarea
          id="filiere-description"
          name="description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            setSuccess(null)
          }}
          rows={3}
          className="mt-1 block w-full rounded-xl border border-hairline bg-white px-3 py-2 text-body-sm text-ink shadow-2xs placeholder:text-ink-faint focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          placeholder="Description ou objectifs du cursus (optionnel)"
        />
      </div>

      <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={pending}>
        <Plus className="h-4 w-4" />
        {pending ? 'Création en cours...' : 'Créer la filière'}
      </Button>
    </form>
  )
}