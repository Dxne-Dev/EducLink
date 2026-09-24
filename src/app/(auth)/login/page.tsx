'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { login, requestPasswordReset } from '@/lib/actions/auth.actions'
import { AuthCard, GlassInput } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Alert } from '@/components/ui/Alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)
  const [verifiedSuccess, setVerifiedSuccess] = useState(false)
  const [inactivityAlert, setInactivityAlert] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('verified') === 'true') {
      setVerifiedSuccess(true)
    }
    if (params.get('reason') === 'inactivity') {
      setInactivityAlert(true)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData()
    fd.set('email', email.trim())
    fd.set('password', password)

    const res = await login(fd)
    if (res?.error) {
      if (res.error.toLowerCase().includes('invalid login credentials') || res.error.toLowerCase().includes('invalid_credentials')) {
        setError('Adresse email ou mot de passe incorrect.')
      } else if (res.error.toLowerCase().includes('email not confirmed')) {
        setError('Votre adresse email n\'a pas encore été confirmée. Veuillez vérifier votre boîte mail.')
      } else {
        setError(res.error)
      }
      setLoading(false)
    }
  }

  async function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault()
    setError(null)
    setResetSent(false)

    if (!email) {
      setError('Saisissez votre adresse email pour réinitialiser votre mot de passe.')
      return
    }

    const res = await requestPasswordReset(email)
    if (res?.error) {
      setError(res.error)
      return
    }
    setResetSent(true)
  }

  return (
    <AuthCard
      title="Connexion à votre compte"
      description="Retrouvez vos cours, fiches et rapports de stage."
      footer={
        <p className="text-body-sm text-ink-muted">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {inactivityAlert && (
          <Alert variant="warning">
            Votre session a expiré après une période d&apos;inactivité prolongée (30 minutes). Veuillez vous reconnecter.
          </Alert>
        )}
        {verifiedSuccess && (
          <Alert variant="success">
            Votre adresse email a été confirmée avec succès ! Vous pouvez maintenant vous connecter.
          </Alert>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
        {resetSent && (
          <Alert variant="success">
            Un email de réinitialisation a été envoyé. Vérifiez votre boîte de
            réception.
          </Alert>
        )}

        <div className="auth-anim-element auth-delay-300 space-y-2">
          <Label htmlFor="email">Adresse email</Label>
          <GlassInput>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="votre@email.com"
              autoComplete="email"
              className="border-transparent bg-transparent px-4 py-3.5 shadow-none focus:shadow-none"
            />
          </GlassInput>
        </div>

        <div className="auth-anim-element auth-delay-400 space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-body-sm font-medium text-primary hover:underline"
            >
              Mot de passe oublié ?
            </button>
          </div>
          <GlassInput>
            <div className="relative flex items-center">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="border-transparent bg-transparent px-4 py-3.5 pr-11 shadow-none focus:shadow-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 flex items-center justify-center text-ink-muted transition-colors hover:text-ink focus:outline-none"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </GlassInput>
        </div>

        <div className="auth-anim-element auth-delay-500">
          <Button type="submit" loading={loading} className="w-full" size="lg">
            {loading ? 'Connexion…' : 'Se connecter'}
          </Button>
        </div>
      </form>
    </AuthCard>
  )
}