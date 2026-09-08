'use client'

import { useState } from 'react'
import { createFiliere } from '@/lib/actions/admin.actions'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export function FiliereForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const res = await createFiliere(formData)
    if (res?.error) setError(res.error)
    setPending(false)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && <Alert variant="danger">{error}</Alert>}
      <div>
        <Label htmlFor="name">Nom *</Label>
        <Input id="name" name="name" required placeholder="Ex: Informatique" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="code">Code *</Label>
        <Input id="code" name="code" required placeholder="Ex: INFO" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          placeholder="Description facultative"
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Création...' : 'Créer la filière'}
      </Button>
    </form>
  )
}
