import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Label } from '@/components/ui/Label'
import { UserCircle, GraduationCap, ArrowLeft, BookOpen, ShieldCheck, Lock } from 'lucide-react'
import Link from 'next/link'
import { ProfileForm } from '@/app/(dashboard)/dashboard/profile/profile-form'

export const metadata = { title: 'Edulink - Profil Enseignant' }

export default async function TeacherProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      full_name,
      role,
      filiere_id,
      created_at,
      filieres(name, code)
    `)
    .eq('id', user.id)
    .single()

  if (!profile) return null

  // Récupérer l'entrée correspondante dans teacher_registry pour cet email si assigné avant activation
  const { data: registryEntry } = await supabase
    .from('teacher_registry')
    .select('id')
    .ilike('email', user.email || '')
    .maybeSingle()

  // Fetch teacher's assigned subjects (via teacher_id ou teacher_registry_id)
  let tmQuery = supabase
    .from('teacher_matieres')
    .select(`
      matiere:matieres(
        id,
        name,
        code,
        niveaux(
          name,
          filieres(name, code)
        )
      )
    `)

  if (registryEntry?.id) {
    tmQuery = tmQuery.or(`teacher_id.eq.${user.id},teacher_registry_id.eq.${registryEntry.id}`)
  } else {
    tmQuery = tmQuery.eq('teacher_id', user.id)
  }

  const { data: teacherMatieres } = await tmQuery

  const rawFiliere = profile.filieres as unknown
  const filiereInfo = (Array.isArray(rawFiliere) ? rawFiliere[0] : rawFiliere) as { name: string; code: string } | null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* En-tête profil */}
      <div className="flex flex-col items-center gap-4 text-center border-b border-hairline pb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary font-amatry text-3xl font-bold shadow-sm">
          {profile.full_name?.charAt(0).toUpperCase() || 'P'}
        </div>
        <div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-heading-2 text-ink">{profile.full_name || 'Enseignant'}</h1>
            <span title="Profil Enseignant Vérifié">
              <ShieldCheck className="h-5 w-5 text-accent-teal" />
            </span>
          </div>
          <p className="text-body-sm text-ink-muted mt-0.5">{user.email}</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="purple" className="flex items-center gap-1 font-semibold">
            <UserCircle className="h-3 w-3" />
            Enseignant / Professeur
          </Badge>
          {filiereInfo && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              Département {filiereInfo.code || filiereInfo.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Informations officielles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-title flex items-center gap-2">
                <Lock className="h-4 w-4 text-accent-purple-deep" />
                Informations académiques & Matières assignées
              </CardTitle>
              <CardDescription>
                Ces informations proviennent du registre officiel administré par l'établissement.
              </CardDescription>
            </div>
            <span className="rounded-full bg-canvas-soft px-3 py-1 text-[11px] font-medium text-ink-muted flex items-center gap-1">
              <Lock className="h-3 w-3" /> Certifié
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2 text-body-sm">
            <div className="rounded-lg border border-hairline bg-canvas-soft/50 p-3.5">
              <Label className="text-caption font-medium text-ink-muted">Nom & Prénom</Label>
              <p className="font-semibold text-ink mt-0.5">{profile.full_name || 'Non renseigné'}</p>
              <p className="text-[11px] text-ink-faint mt-1">Identité déclarée au registre</p>
            </div>

            <div className="rounded-lg border border-hairline bg-canvas-soft/50 p-3.5">
              <Label className="text-caption font-medium text-ink-muted">Email professionnel</Label>
              <p className="font-mono text-ink mt-0.5">{user.email}</p>
              <p className="text-[11px] text-ink-faint mt-1">Identifiant de session officiel</p>
            </div>

            <div className="rounded-lg border border-hairline bg-canvas-soft/50 p-3.5 sm:col-span-2">
              <Label className="text-caption font-medium text-ink-muted">Matières & Unités d'enseignement assignées</Label>
              {teacherMatieres && teacherMatieres.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {teacherMatieres.map((item: any, idx: number) => {
                    const m = item.matiere
                    if (!m) return null
                    const niveauObj = Array.isArray(m.niveaux) ? m.niveaux[0] : m.niveaux
                    const filiereObj = Array.isArray(niveauObj?.filieres) ? niveauObj?.filieres[0] : niveauObj?.filieres
                    const filiereCode = filiereObj?.code
                    const niveauName = niveauObj?.name
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface px-2.5 py-1 text-caption font-medium text-ink"
                      >
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        {m.name} {filiereCode ? `(${filiereCode})` : ''} {niveauName ? `• ${niveauName}` : ''}
                      </span>
                    )
                  })}
                </div>
              ) : (
                <p className="text-ink-muted text-caption mt-1">Aucune matière assignée pour le moment.</p>
              )}
            </div>

            <div className="rounded-lg border border-hairline bg-canvas-soft/50 p-3.5 sm:col-span-2">
              <Label className="text-caption font-medium text-ink-muted">Date d'enregistrement</Label>
              <p className="font-semibold text-ink mt-0.5">
                {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire mot de passe */}
      <ProfileForm />

      {/* Retour dashboard */}
      <div className="pt-2">
        <Link
          href="/prof/dashboard"
          className="inline-flex items-center gap-2 text-body-sm font-medium text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord enseignant
        </Link>
      </div>
    </div>
  )
}
