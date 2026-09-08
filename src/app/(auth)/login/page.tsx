'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthCard, GlassInput } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Alert } from '@/components/ui/Alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
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
        {error && <Alert variant="danger">{error}</Alert>}

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
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="text-body-sm font-medium text-primary hover:underline"
            >
              Mot de passe oublié ?
            </a>
          </div>
          <GlassInput>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
              className="border-transparent bg-transparent px-4 py-3.5 shadow-none focus:shadow-none"
            />
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