'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthCard, GlassInput } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
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
      title="Créer un compte"
      description="Étudiants et enseignants, rejoignez votre espace pédagogique."
      footer={
        <p className="text-body-sm text-ink-muted">
          Déjà un compte ?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="auth-anim-element auth-delay-300 space-y-2">
          <Label htmlFor="fullName">Nom complet</Label>
          <GlassInput>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Jean Dupont"
              autoComplete="name"
              className="border-transparent bg-transparent px-4 py-3.5 shadow-none focus:shadow-none"
            />
          </GlassInput>
        </div>

        <div className="auth-anim-element auth-delay-400 space-y-2">
          <Label htmlFor="email">Email</Label>
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

        <div className="auth-anim-element auth-delay-500 space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <GlassInput>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              autoComplete="new-password"
              className="border-transparent bg-transparent px-4 py-3.5 shadow-none focus:shadow-none"
            />
          </GlassInput>
        </div>

        <div className="auth-anim-element auth-delay-600 space-y-2">
          <Label htmlFor="role">Je suis</Label>
          <GlassInput>
            <Select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'student' | 'teacher')}
              className="border-transparent bg-transparent px-4 py-3.5 shadow-none focus:shadow-none"
            >
              <option value="student">Étudiant</option>
              <option value="teacher">Enseignant</option>
            </Select>
          </GlassInput>
        </div>

        <div className="auth-anim-element auth-delay-700">
          <Button type="submit" loading={loading} className="w-full" size="lg">
            {loading ? 'Création…' : 'Créer mon compte'}
          </Button>
        </div>
      </form>
    </AuthCard>
  )
}