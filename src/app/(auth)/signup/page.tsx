'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MailCheck, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthCard, GlassInput } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { getPublicFilieres, getLevelsByFiliere, signup } from '@/lib/actions/auth.actions'
import type { Filiere, Niveau } from '@/types/database'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<'' | 'student' | 'teacher'>('')
  const [filiereId, setFiliereId] = useState('')       // étudiant
  const [niveauId, setNiveauId] = useState('')         // étudiant
  const [filieres, setFilieres] = useState<Pick<Filiere, 'id' | 'name' | 'code'>[]>([])
  const [niveaux, setNiveaux] = useState<Pick<Niveau, 'id' | 'name'>[]>([])
  const [loadingFilieres, setLoadingFilieres] = useState(true)
  const [loadingNiveaux, setLoadingNiveaux] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [confirmedEmail, setConfirmedEmail] = useState('')

  // Charger les filières pour le select étudiant via Server Action (bypasse les soucis RLS anonyme)
  useEffect(() => {
    getPublicFilieres()
      .then((data) => {
        setFilieres(data ?? [])
        setLoadingFilieres(false)
      })
      .catch(() => {
        setLoadingFilieres(false)
      })
  }, [])

  // Charger les niveaux quand la filière change
  useEffect(() => {
    if (!filiereId) {
      setNiveaux([])
      setNiveauId('')
      setLoadingNiveaux(false)
      return
    }
    setLoadingNiveaux(true)
    getLevelsByFiliere(filiereId)
      .then((data) => {
        setNiveaux(data ?? [])
        setLoadingNiveaux(false)
      })
      .catch(() => {
        setLoadingNiveaux(false)
      })
  }, [filiereId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!role) {
      setError('Veuillez choisir un rôle pour continuer.')
      return
    }
    if (role === 'student' && (!filiereId || !niveauId)) {
      setError('Veuillez sélectionner votre filière et votre niveau.')
      return
    }

    setLoading(true)

    // Vérification enseignant + signUp via server action
    const { signup } = await import('@/lib/actions/auth.actions')
    const fd = new FormData()
    fd.set('email', email)
    fd.set('password', password)
    fd.set('fullName', fullName)
    fd.set('role', role)
    if (role === 'student' && filiereId) {
      fd.set('filiere_id', filiereId)
      fd.set('niveau_id', niveauId)
    }

    const result = await signup(fd)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result?.needsConfirmation) {
      setConfirmedEmail(email)
      setNeedsConfirmation(true)
      return
    }

    // Si la server action redirige, on n'arrive pas ici
  }

  // ── Écran de confirmation email ───────────────────────────────────────────
  if (needsConfirmation) {
    return (
      <AuthCard
        title="Vérifiez votre email"
        description="Activez votre compte pour commencer."
      >
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-hairline bg-white p-8 text-center shadow-level-1">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
              <MailCheck className="h-6 w-6" />
            </span>
            <p className="text-body-md text-ink-secondary">
              Nous avons envoyé un lien de confirmation à{' '}
              <span className="font-medium text-ink">{confirmedEmail}</span>.
              Cliquez sur le lien pour activer votre compte, puis connectez-vous.
            </p>
            <p className="text-body-sm text-ink-muted">
              Vous ne recevez rien ? Vérifiez votre dossier spam.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded bg-primary px-8 text-body-md font-medium text-white shadow-level-1 transition-all duration-150 hover:active:scale-[0.97]"
          >
            Se connecter
          </Link>
        </div>
      </AuthCard>
    )
  }

  // ── Formulaire d'inscription ──────────────────────────────────────────────
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

        {/* Nom complet */}
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

        {/* Email */}
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

        {/* Mot de passe */}
        <div className="auth-anim-element auth-delay-500 space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
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

        {/* Rôle */}
        <div className="auth-anim-element auth-delay-600 space-y-2">
          <Label htmlFor="role">Je suis</Label>
          <GlassInput>
            <div className="relative flex items-center">
              <Select
                id="role"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as '' | 'student' | 'teacher')
                  setFiliereId('')
                }}
                required
                className="h-12 w-full appearance-none border-transparent bg-transparent px-4 pr-10 text-body-md shadow-none focus:shadow-none focus:outline-none"
              >
                <option value="" disabled hidden>Choisir un rôle</option>
                <option value="student" className="bg-white text-ink">Étudiant</option>
                <option value="teacher" className="bg-white text-ink">Enseignant</option>
              </Select>
              <div className="pointer-events-none absolute right-4 text-ink-muted">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </GlassInput>
        </div>

        {/* Filière — uniquement pour les étudiants */}
        {role === 'student' && (
          <div className="space-y-4 animate-slide-up">
            <div className="space-y-2">
              <Label htmlFor="filiere">Ma filière</Label>
              <GlassInput>
                <div className="relative flex items-center">
                  <Select
                    id="filiere"
                    value={filiereId}
                    onChange={(e) => {
                      setFiliereId(e.target.value)
                      setNiveauId('')
                    }}
                    required
                    className="h-12 w-full appearance-none border-transparent bg-transparent px-4 pr-10 text-body-md shadow-none focus:shadow-none focus:outline-none"
                  >
                    <option value="" disabled hidden>
                      {loadingFilieres ? 'Chargement des filières...' : 'Sélectionner une filière'}
                    </option>
                    {filieres.map((f) => (
                      <option key={f.id} value={f.id} className="bg-white text-ink">
                        {f.name} {f.code ? `(${f.code})` : ''}
                      </option>
                    ))}
                    {!loadingFilieres && filieres.length === 0 && (
                      <option value="" disabled>Aucune filière configurée</option>
                    )}
                  </Select>
                  <div className="pointer-events-none absolute right-4 text-ink-muted">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </GlassInput>
            </div>

            <div className="space-y-2">
              <Label htmlFor="niveau">Mon niveau</Label>
              <GlassInput>
                <div className="relative flex items-center">
                  <Select
                    id="niveau"
                    value={niveauId}
                    onChange={(e) => setNiveauId(e.target.value)}
                    required
                    disabled={!filiereId}
                    className="h-12 w-full appearance-none border-transparent bg-transparent px-4 pr-10 text-body-md shadow-none focus:shadow-none focus:outline-none disabled:opacity-50"
                  >
                    <option value="" disabled hidden>
                      {loadingNiveaux ? 'Chargement...' : !filiereId ? 'Sélectionnez d\'abord une filière' : 'Sélectionner un niveau'}
                    </option>
                    {niveaux.map((n) => (
                      <option key={n.id} value={n.id} className="bg-white text-ink">
                        {n.name}
                      </option>
                    ))}
                  </Select>
                  <div className="pointer-events-none absolute right-4 text-ink-muted">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </GlassInput>
            </div>
            <p className="text-body-sm text-ink-muted">
              Votre filière et niveau déterminent quels enseignants et ressources vous sont accessibles.
            </p>
          </div>
        )}

        {/* Message info pour les enseignants */}
        {role === 'teacher' && (
          <div className="animate-slide-up rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-body-sm text-ink-secondary">
              🔐 Votre inscription sera vérifiée contre notre registre d'enseignants.
              Si vous n'êtes pas encore enregistré, contactez l'administration.
            </p>
          </div>
        )}

        {/* Bouton */}
        <div className="auth-anim-element auth-delay-700">
          <Button type="submit" loading={loading} className="w-full" size="lg">
            {loading ? 'Vérification…' : 'Créer mon compte'}
          </Button>
        </div>
      </form>
    </AuthCard>
  )
}