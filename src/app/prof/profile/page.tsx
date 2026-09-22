import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { UserCircle, BookOpen } from 'lucide-react'
import { ProfileLayout } from '@/components/profile/ProfileLayout'
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

  const fullName = profile.full_name || 'Enseignant'
  const initial = fullName.charAt(0).toUpperCase()
  const hasMatieres = Boolean(teacherMatieres && teacherMatieres.length > 0)

  return (
    <ProfileLayout
      breadcrumb={[{ label: 'Espace enseignant', href: '/prof/dashboard' }, { label: 'Mon profil' }]}
      heading="Mon profil"
      subtitle="Votre identité professionnelle, vos matières assignées et vos informations de connexion."
      name={fullName}
      email={user.email ?? ''}
      initial={initial}
      metaLine={
        filiereInfo ? `Département ${filiereInfo.code || filiereInfo.name}` : undefined
      }
      badges={
        <>
          <Badge variant="purple" className="flex items-center gap-1 font-semibold">
            <UserCircle className="h-3 w-3" />
            Enseignant / Professeur
          </Badge>
          {hasMatieres && (
            <Badge variant="teal" className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {teacherMatieres?.length} matière(s) assignée(s)
            </Badge>
          )}
        </>
      }
      sectionsTitle="Informations académiques & Matières assignées"
      sectionsDescription="Ces informations proviennent du registre officiel administré par l'établissement."
      readOnly
      readOnlyLabel="Certifié"
      sections={[
        {
          title: 'Identité',
          fields: [
            {
              label: 'Nom & Prénom',
              value: profile.full_name || 'Non renseigné',
              hint: 'Identité déclarée au registre',
            },
            {
              label: 'Email professionnel',
              value: <span className="font-mono">{user.email}</span>,
              hint: 'Identifiant de session officiel',
            },
          ],
        },
        {
          title: 'Inscription',
          fields: [
            {
              label: "Date d'enregistrement",
              value: new Date(profile.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              hint: "Date d'ouverture du compte",
            },
          ],
        },
        {
          title: "Matières & Unités d'enseignement assignées",
          wide: true,
          fields: [
            {
              label: 'Matières assignées',
              full: true,
              value: hasMatieres ? (
                <div className="flex flex-wrap gap-2">
                  {teacherMatieres?.map((item: any, idx: number) => {
                    const m = item.matiere
                    if (!m) return null
                    const niveauObj = Array.isArray(m.niveaux) ? m.niveaux[0] : m.niveaux
                    const filiereObj = Array.isArray(niveauObj?.filieres) ? niveauObj?.filieres[0] : niveauObj?.filieres
                    const filiereCode = filiereObj?.code
                    const niveauName = niveauObj?.name
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-canvas-soft px-2.5 py-1 text-caption font-medium text-ink dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        {m.name} {filiereCode ? `(${filiereCode})` : ''} {niveauName ? `• ${niveauName}` : ''}
                      </span>
                    )
                  })}
                </div>
              ) : (
                <span className="text-caption text-ink-muted dark:text-slate-400">
                  Aucune matière assignée pour le moment.
                </span>
              ),
            },
          ],
        },
      ]}
      extraContent={<ProfileForm />}
      backHref="/prof/dashboard"
      backLabel="Retour au tableau de bord enseignant"
    />
  )
}