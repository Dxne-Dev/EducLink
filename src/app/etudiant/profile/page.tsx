import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Label } from '@/components/ui/Label'
import { UserCircle, GraduationCap, Clock, ArrowLeft, Building2, Lock, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { ProfileForm } from '@/app/(dashboard)/dashboard/profile/profile-form'

export const metadata = { title: 'Edulink - Profil Étudiant' }

export default async function StudentProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      full_name,
      role,
      filiere_id,
      niveau_id,
      promo_id,
      created_at,
      filieres(name, code),
      promotions(name, year_start, year_end, niveau_id, niveaux(name)),
      niveaux(name)
    `)
    .eq('id', user.id)
    .maybeSingle()

  const rawFiliere = profile?.filieres as unknown
  const filiereInfo = (Array.isArray(rawFiliere) ? rawFiliere[0] : rawFiliere) as { name: string; code: string } | null

  const rawPromo = profile?.promotions as any
  const promoInfo = (Array.isArray(rawPromo) ? rawPromo[0] : rawPromo) as {
    name: string
    year_start: number
    year_end: number
    niveaux?: { name: string }
  } | null

  const rawNiveau = profile?.niveaux as unknown
  const niveauInfo = promoInfo?.niveaux || ((Array.isArray(rawNiveau) ? rawNiveau[0] : rawNiveau) as { name: string } | null)

  const fullName = profile?.full_name || user.user_metadata?.full_name || 'Étudiant'
  const createdAt = profile?.created_at || user.created_at

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* En-tête profil */}
      <div className="flex flex-col items-center gap-4 text-center border-b border-hairline pb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary font-amatry text-3xl font-bold shadow-sm">
          {fullName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-heading-2 text-ink">{fullName}</h1>
            <span title="Profil vérifié">
              <ShieldCheck className="h-5 w-5 text-accent-teal" />
            </span>
          </div>
          <p className="text-body-sm text-ink-muted mt-0.5">{user.email}</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {filiereInfo && (
            <Badge variant="purple" className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {filiereInfo.code || filiereInfo.name}
            </Badge>
          )}
          {niveauInfo && (
            <Badge variant="secondary" className="flex items-center gap-1 font-semibold text-primary">
              <Clock className="h-3 w-3" />
              {niveauInfo.name}
            </Badge>
          )}
          {promoInfo && (
            <Badge variant="default" className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {promoInfo.name}
            </Badge>
          )}
          <Badge variant="default" className="flex items-center gap-1">
            <UserCircle className="h-3 w-3" />
            Étudiant
          </Badge>
        </div>
      </div>

      {/* Informations officielles verrouillées */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-title flex items-center gap-2">
                <Lock className="h-4 w-4 text-accent-purple-deep" />
                Informations académiques officielles
              </CardTitle>
              <CardDescription>
                Ces données sont certifiées et verrouillées par l'administration universitaire.
              </CardDescription>
            </div>
            <span className="rounded-full bg-canvas-soft px-3 py-1 text-[11px] font-medium text-ink-muted flex items-center gap-1">
              <Lock className="h-3 w-3" /> Lecture seule
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2 text-body-sm">
            <div className="rounded-lg border border-hairline bg-canvas-soft/50 p-3.5">
              <Label className="text-caption font-medium text-ink-muted">Nom & Prénom</Label>
              <p className="font-semibold text-ink mt-0.5">{fullName}</p>
              <p className="text-[11px] text-ink-faint mt-1">Identité déclarée au registre</p>
            </div>

            <div className="rounded-lg border border-hairline bg-canvas-soft/50 p-3.5">
              <Label className="text-caption font-medium text-ink-muted">Email universitaire</Label>
              <p className="font-mono text-ink mt-0.5">{user.email}</p>
              <p className="text-[11px] text-ink-faint mt-1">Identifiant de session officiel</p>
            </div>

            <div className="rounded-lg border border-hairline bg-canvas-soft/50 p-3.5">
              <Label className="text-caption font-medium text-ink-muted">Filière d'étude</Label>
              <p className="font-semibold text-ink mt-0.5">
                {filiereInfo ? `${filiereInfo.name} (${filiereInfo.code})` : 'Non assignée'}
              </p>
              <p className="text-[11px] text-ink-faint mt-1">Cursus immuable</p>
            </div>

            <div className="rounded-lg border border-hairline bg-canvas-soft/50 p-3.5">
              <Label className="text-caption font-medium text-ink-muted">Niveau actuel</Label>
              <p className="font-semibold text-primary mt-0.5">{niveauInfo?.name || 'Non assigné'}</p>
              <p className="text-[11px] text-ink-faint mt-1">Année académique en cours</p>
            </div>

            <div className="rounded-lg border border-hairline bg-canvas-soft/50 p-3.5">
              <Label className="text-caption font-medium text-ink-muted">Promotion</Label>
              <p className="font-semibold text-ink mt-0.5">
                {promoInfo ? `${promoInfo.name} (${promoInfo.year_start}-${promoInfo.year_end})` : 'Promotion en cours de validation'}
              </p>
              <p className="text-[11px] text-ink-faint mt-1">Cohorte d'appartenance</p>
            </div>

            <div className="rounded-lg border border-hairline bg-canvas-soft/50 p-3.5">
              <Label className="text-caption font-medium text-ink-muted">Date d'inscription</Label>
              <p className="font-semibold text-ink mt-0.5">
                {new Date(createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-[11px] text-ink-faint mt-1">Date d'ouverture du compte</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire mot de passe */}
      <ProfileForm />

      {/* Retour dashboard */}
      <div className="pt-2">
        <Link
          href="/etudiant/dashboard"
          className="inline-flex items-center gap-2 text-body-sm font-medium text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord étudiant
        </Link>
      </div>
    </div>
  )
}
