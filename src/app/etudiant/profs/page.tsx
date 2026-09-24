import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { BookOpen, Mail, GraduationCap, ArrowRight, UserCheck, Award } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Icon } from '@/components/ui/Icon'

export const metadata = { title: 'Edulink - Mes Profs' }

export default async function StudentProfsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // 1. Profil de l'étudiant avec sa filière, son niveau direct et sa promotion éventuelle
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      filiere_id,
      niveau_id,
      promo_id,
      filieres(id, name, code),
      promotions(id, name, niveau_id, niveaux(id, name))
    `)
    .eq('id', user.id)
    .single()

  const rawFiliere = profile?.filieres as unknown
  const filiereInfo = (Array.isArray(rawFiliere) ? rawFiliere[0] : rawFiliere) as { id: string; name: string; code: string } | null
  const studentFiliereId = filiereInfo?.id || profile?.filiere_id

  // 2. Niveau actuel : priorité au niveau de la promotion en cours (dynamique), sinon niveau du profil
  const rawPromo = profile?.promotions as unknown
  const promoInfo = (Array.isArray(rawPromo) ? rawPromo[0] : rawPromo) as { id: string; name: string; niveau_id: string; niveaux?: { id: string; name: string } } | null

  const studentNiveauId = promoInfo?.niveau_id || profile?.niveau_id
  const niveauName = promoInfo?.niveaux?.name

  let teachers: any[] = []

  if (studentFiliereId && studentNiveauId) {
    // 3. Récupérer toutes les matières de ce niveau
    const { data: matieresData } = await supabase
      .from('matieres')
      .select('id, name, code')
      .eq('niveau_id', studentNiveauId)

    const levelMatieres = matieresData ?? []
    const levelMatiereIds = levelMatieres.map((m) => m.id)

    if (levelMatiereIds.length > 0) {
      // 4. Trouver les enseignants affectés à ces matières dans teacher_matieres
      const { data: assignments } = await supabase
        .from('teacher_matieres')
        .select(`
          id,
          matiere_id,
          teacher_id,
          teacher_registry_id,
          profiles:teacher_id (id, full_name, role),
          teacher_registry:teacher_registry_id (id, full_name, email),
          matieres (id, name)
        `)
        .in('matiere_id', levelMatiereIds)

      // Regrouper par enseignant
      const teacherMap = new Map<string, {
        id: string
        name: string
        email: string
        matieres: Set<string>
        profileId: string | null
      }>()

      assignments?.forEach((a: any) => {
        const profName = a.profiles?.full_name || a.teacher_registry?.full_name
        const profEmail = a.teacher_registry?.email || ''
        const key = a.teacher_id || a.teacher_registry_id || profName

        if (profName && key) {
          if (!teacherMap.has(key)) {
            teacherMap.set(key, {
              id: key,
              name: profName,
              email: profEmail,
              matieres: new Set(),
              profileId: a.teacher_id || null,
            })
          }
          const item = teacherMap.get(key)!
          if (a.matieres?.name) {
            item.matieres.add(a.matieres.name)
          }
        }
      })

      // 5. Compter les ressources publiées par chaque enseignant pour ces matières
      const teacherList = Array.from(teacherMap.values())
      const teacherProfileIds = teacherList.map((t) => t.profileId).filter(Boolean) as string[]

      let resourceCounts: Record<string, number> = {}
      if (teacherProfileIds.length > 0) {
        const { data: resources } = await supabase
          .from('resources')
          .select('uploaded_by')
          .in('uploaded_by', teacherProfileIds)
          .eq('visibility', 'public')

        resources?.forEach((r: any) => {
          resourceCounts[r.uploaded_by] = (resourceCounts[r.uploaded_by] || 0) + 1
        })
      }

      teachers = teacherList.map((t) => ({
        ...t,
        matieresList: Array.from(t.matieres),
        count: t.profileId ? (resourceCounts[t.profileId] || 0) : 0,
      }))
    }
  }

  const breadcrumb = [
    { label: 'Espace Étudiant', href: '/etudiant/dashboard' },
    { label: 'Mes Professeurs' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <PageHeader
        breadcrumb={breadcrumb}
        title="Corps Professoral de ma Filière"
        subtitle={
          filiereInfo
            ? `Enseignants officiellement affectés aux matières de votre niveau (${filiereInfo.name}${niveauName ? ` · ${niveauName}` : ''}).`
            : 'Découvrez vos enseignants associés à votre cursus.'
        }
      />

      {!studentFiliereId ? (
        <Card className="rounded-3xl border border-hairline bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="py-12">
            <EmptyState
              icon={<Icon name="solar:diploma-verified-bold-duotone" className="text-4xl text-accent-purple-deep" />}
              title="Filière non renseignée"
              description="Votre profil n'a pas encore de filière assignée. Rendez-vous dans votre profil ou contactez l'administration."
            />
          </CardContent>
        </Card>
      ) : teachers.length === 0 ? (
        <Card className="rounded-3xl border border-hairline bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="py-12">
            <EmptyState
              icon={<Icon name="solar:user-check-bold-duotone" className="text-4xl text-accent-orange-deep" />}
              title="Aucun enseignant affecté pour le moment"
              description="L'administration universitaire n'a pas encore finalisé les affectations de professeurs pour les matières de votre niveau."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((prof) => (
            <Card
              key={prof.id}
              className="flex flex-col justify-between rounded-3xl border border-hairline bg-white shadow-xs transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-amatry text-xl font-bold dark:bg-primary/20 dark:text-sky-300">
                    {prof.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-ink dark:text-slate-100 text-body-md truncate" title={prof.name}>
                      {prof.name}
                    </h3>
                    <p className="text-caption text-ink-muted dark:text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
                      <Mail className="h-3 w-3 shrink-0" />
                      {prof.email || 'Email universitaire'}
                    </p>
                  </div>
                </div>

                {prof.matieresList.length > 0 && (
                  <div className="space-y-1.5 rounded-2xl bg-canvas-soft/80 dark:bg-slate-800/60 p-3 border border-hairline dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint dark:text-slate-400">
                      Matières enseignées
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {prof.matieresList.map((mat: string) => (
                        <span
                          key={mat}
                          className="rounded-lg bg-white dark:bg-slate-900 border border-hairline dark:border-slate-700 px-2.5 py-1 text-[11px] font-medium text-ink dark:text-slate-200 shadow-2xs"
                        >
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-hairline dark:border-slate-800 pt-3 flex items-center justify-between text-caption">
                  <span className="text-ink-muted dark:text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    <strong className="text-ink dark:text-slate-200">{prof.count}</strong> document{prof.count > 1 ? 's' : ''}
                  </span>

                  {prof.profileId ? (
                    <Link
                      href={`/etudiant/ressources?prof=${encodeURIComponent(prof.name)}`}
                      className="inline-flex items-center gap-1 font-semibold text-primary dark:text-sky-400 hover:underline"
                    >
                      <span>Ses cours</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="text-[11px] text-ink-faint dark:text-slate-500 italic">
                      Compte en cours d'activation
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
