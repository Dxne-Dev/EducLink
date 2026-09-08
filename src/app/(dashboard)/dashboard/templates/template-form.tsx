'use client'

import { useState } from 'react'
import { createTemplate } from '@/lib/actions/template.actions'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { TEMPLATE_CATEGORIES } from '@/lib/constants'

export function TemplateForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const res = await createTemplate(formData)
    if (res?.error) setError(res.error)
    setPending(false)
  }

  return (
    <form action={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      {error && <div className="sm:col-span-2"><Alert variant="danger">{error}</Alert></div>}
      <div>
        <Label htmlFor="name">Nom *</Label>
        <Input id="name" name="name" required placeholder="Ex: Convention de stage" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="category">Catégorie *</Label>
        <Select id="category" name="category" required className="mt-1" defaultValue="convention">
          {TEMPLATE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" placeholder="Description facultative" className="mt-1" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="file">Fichier *</Label>
        <Input id="file" name="file" type="file" required className="mt-1" accept=".pdf,.docx,.xlsx,.pptx" />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Téléversement...' : 'Ajouter le modèle'}
        </Button>
      </div>
    </form>
  )
}
