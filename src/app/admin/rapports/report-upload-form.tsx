'use client'

import { useState } from 'react'
import { uploadInternshipReport } from '@/lib/actions/internship.actions'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ALLOWED_REPORT_TYPES } from '@/lib/constants'

export function ReportUploadForm({ internshipId }: { internshipId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const file = formData.get('file') as File | null
    if (file && !ALLOWED_REPORT_TYPES.includes(file.type as any)) {
      setError('Format non autorisé. Utilisez PDF ou DOCX.')
      setPending(false)
      return
    }
    const res = await uploadInternshipReport(formData)
    if (res?.error) setError(res.error)
    setPending(false)
  }

  return (
    <form action={handleSubmit} className="mt-3 flex flex-wrap items-end gap-3 border-t pt-3 dark:border-gray-800">
      <input type="hidden" name="internship_id" value={internshipId} />
      <div className="min-w-[200px] flex-1">
        <Input name="file" type="file" accept=".pdf,.docx" required />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? 'Dépôt...' : 'Déposer le rapport'}
      </Button>
      {error && <div className="w-full"><Alert variant="danger">{error}</Alert></div>}
    </form>
  )
}
