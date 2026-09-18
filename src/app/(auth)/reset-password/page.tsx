'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, KeyRound, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthCard, GlassInput } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Alert } from '@/components/ui/Alert'

/**
 * Page atteinte via le lien "réinitialiser le mot de passe" envoyé par email.
 *
 * Deux flux possibles selon la config Supabase :
 *  - PKCE (défaut) : l'email redirige avec `?code=...` → on échange ce code
 *    contre une session via exchangeCodeForSession.
 *  - Implicite : les tokens arrivent dans le hash (`#access_token=...`) et
 *    supabase-js les récupère automatiquement via getSession().
 */
export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Flux PKCE : le token arrive en ?code=...
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) setError(error.message)
          else setSessionReady(true)
        })
        .catch(() => setError('Lien invalide ou expiré.'))
      return
    }

    // Flux implicite : Supabase JS parse automatiquement le hash (#access_token=...)
    // On écoute l'événement PASSWORD_RECOVERY pour confirmer que la session est prête
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionReady(true)
      }
    })

    // Vérifier si une session existe déjà (cas où la page est rechargée)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <AuthCard title="Mot de passe mis à jour">
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-hairline bg-white p-8 text-center shadow-level-1">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
              <KeyRound className="h-6 w-6" />
            </span>
            <p className="text-body-md text-ink-secondary">
              Votre mot de passe a bien été modifié. Vous pouvez vous connecter
              avec votre nouveau mot de passe.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded bg-primary px-8 text-body-md font-medium text-white shadow-level-1 transition-all duration-150 hover:active:scale-[0.97]"
          >
            <LogIn className="h-4 w-4" />
            Se connecter
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Définir un nouveau mot de passe"
      description="Choisissez un nouveau mot de passe pour votre compte."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="auth-anim-element auth-delay-300 space-y-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <GlassInput>
            <div className="relative flex items-center">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                autoComplete="new-password"
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

        <div className="auth-anim-element auth-delay-400 space-y-2">
          <Label htmlFor="confirm">Confirmer le mot de passe</Label>
          <GlassInput>
            <div className="relative flex items-center">
              <Input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                autoComplete="new-password"
                className="border-transparent bg-transparent px-4 py-3.5 pr-11 shadow-none focus:shadow-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 flex items-center justify-center text-ink-muted transition-colors hover:text-ink focus:outline-none"
                aria-label={showConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </GlassInput>
        </div>

        <div className="auth-anim-element auth-delay-500">
          <Button type="submit" loading={loading} className="w-full" size="lg">
            {loading ? 'Enregistrement…' : 'Mettre à jour'}
          </Button>
        </div>
      </form>
    </AuthCard>
  )
}
