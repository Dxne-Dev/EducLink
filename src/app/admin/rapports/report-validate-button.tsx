'use client'

import { useState, useTransition } from 'react'
import { validateReport } from '@/lib/actions/internship.actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Modal, ModalTitle, ModalDescription } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { CheckCircle2 } from 'lucide-react'

export function ReportValidateButton({ reportId }: { reportId: string }) {
  const [open, setOpen] = useState(false)
  const [grade, setGrade] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleValidate() {
    const parsed = grade === '' ? null : Number(grade)
    if (parsed != null && (isNaN(parsed) || parsed < 0 || parsed > 20)) {
      setError('La note doit être comprise entre 0 et 20')
      return
    }
    startTransition(async () => {
      const res = await validateReport(reportId, parsed)
      if (res?.error) setError(res.error)
      else setOpen(false)
    })
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <CheckCircle2 className="mr-1 h-4 w-4" /> Valider
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalTitle>Valider le rapport</ModalTitle>
        <ModalDescription>Confirmez la validation et attribuez une note (facultative).</ModalDescription>
        <div className="mt-4 space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          <div>
            <Label htmlFor="grade">Note /20 (facultative)</Label>
            <Input
              id="grade"
              type="number"
              min={0}
              max={20}
              step="0.5"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Ex: 15.5"
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleValidate} disabled={pending}>
              {pending ? 'Validation...' : 'Valider le rapport'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
