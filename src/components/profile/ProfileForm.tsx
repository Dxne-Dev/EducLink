'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { updateMyPassword } from '@/lib/actions/user.actions'
import { KeyRound, CheckCircle2 } from 'lucide-react'

export function ProfileForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    startTransition(async () => {
      const res = await updateMyPassword(password)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess('Votre mot de passe a été modifié avec succès !')
        setPassword('')
        setConfirmPassword('')
        setTimeout(() => setSuccess(null), 5000)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Modification Mot de passe */}
      <Card className="rounded-3xl border border-hairline bg-white dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-title flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            Sécurité du compte (Mot de passe)
          </CardTitle>
          <CardDescription>
            Modifiez votre mot de passe de connexion. Choisissez un mot de passe robuste.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && (
            <Alert variant="success" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </Alert>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <Button type="submit" loading={isPending}>
              Mettre à jour le mot de passe
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
