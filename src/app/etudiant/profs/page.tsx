import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { BookOpen, Mail, GraduationCap } from 'lucide-react'
import Link from 'next/link'

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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-heading-2 text-ink">Mes Professeurs</h1>
            {filiereInfo && (
              <Badge variant="purple" className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {filiereInfo.code || filiereInfo.name}
              </Badge>
            )}
            {niveauName && (
              <Badge variant="secondary" className="font-semibold text-primary">
                {niveauName}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-body-sm text-ink-muted">
            {filiereInfo
              ? `Corps professoral affecté aux matières de votre niveau (${filiereInfo.name}${niveauName ? ` · ${niveauName}` : ''}).`
              : 'Découvrez vos enseignants associés à votre cursus.'}
          </p>
        </div>
      </div>

      {!studentFiliereId ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              title="Filière non renseignée"
              description="Votre profil n'a pas encore de filière assignée. Rendez-vous dans votre profil ou contactez l'administration."
            />
          </CardContent>
        </Card>
      ) : teachers.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              title="Aucun enseignant affecté à votre niveau"
              description="L'administration n'a pas encore finalisé les affectations de professeurs pour les matières de votre niveau."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((prof) => (
            <Card key={prof.id} className="transition-all hover:shadow-level-1">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-content-center rounded-full bg-primary/10 text-primary font-amatry text-xl font-bold">
                    {prof.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-ink text-title truncate">{prof.name}</h3>
                    <p className="text-caption text-ink-muted flex items-center gap-1 truncate mt-0.5">
                      <Mail className="h-3 w-3 shrink-0" />
                      {prof.email || 'Email non renseigné'}
                    </p>
                  </div>
                </div>

                {prof.matieresList.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-eyebrow uppercase text-ink-faint">Matières enseignées</p>
                    <div className="flex flex-wrap gap-1">
                      {prof.matieresList.map((mat: string) => (
                        <span
                          key={mat}
                          className="rounded-md bg-canvas-soft px-2 py-0.5 text-caption font-medium text-ink"
                        >
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-hairline pt-3 flex items-center justify-between">
                  <span className="text-caption text-ink-muted flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {prof.count} ressource{prof.count > 1 ? 's' : ''}
                  </span>
                  {prof.profileId ? (
                    <Link
                      href={`/etudiant/ressources?prof=${encodeURIComponent(prof.name)}`}
                      className="text-caption font-medium text-primary hover:underline"
                    >
                      Voir les ressources →
                    </Link>
                  ) : (
                    <span className="text-caption text-ink-faint">
                      Compte en attente
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
