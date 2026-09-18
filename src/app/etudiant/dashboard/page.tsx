import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  BookOpen,
  FileText,
  Briefcase,
  Sparkles,
  UserCheck,
  GraduationCap,
  ArrowRight,
  Clock,
  ExternalLink,
  Search,
} from 'lucide-react'
import { RealtimeResourcesWatcher } from '@/components/realtime/RealtimeResourcesWatcher'

export const metadata = { title: 'Edulink - Espace Étudiant' }

export default async function StudentDashboardPage() {
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
      filieres(name, code),
      promotions(name, niveau_id, niveaux(name))
    `)
    .eq('id', user.id)
    .single()

  if (profile?.role === 'teacher') {
    redirect('/prof/dashboard')
  }
  if (profile?.role === 'admin') {
    redirect('/admin/dashboard')
  }

  const filiereInfo = profile?.filieres as unknown as { name: string; code: string } | null
  const filiereData = Array.isArray(filiereInfo) ? filiereInfo[0] : filiereInfo

  const studentFiliereId = profile?.filiere_id
  const rawPromo = profile?.promotions as any
  const promoData = Array.isArray(rawPromo) ? rawPromo[0] : rawPromo
  const studentNiveauId = promoData?.niveau_id || profile?.niveau_id
  const currentNiveauName = promoData?.niveaux?.name || ''

  let teacherCount = 0
  let availableResources = 0
  let templatesCount = 0
  let recentResources: any[] = []

  if (studentFiliereId && studentNiveauId) {
    // Matières de ce niveau
    const { data: matieres } = await supabase
      .from('matieres')
      .select('id')
      .eq('niveau_id', studentNiveauId)

    const matiereIds = matieres?.map((m) => m.id) ?? []

    // Professeurs affectés à ces matières
    if (matiereIds.length > 0) {
      const { data: assigned } = await supabase
        .from('teacher_matieres')
        .select('teacher_id, teacher_registry_id')
        .in('matiere_id', matiereIds)

      const profKeys = new Set(
        assigned?.map((a) => a.teacher_id || a.teacher_registry_id).filter(Boolean)
      )
      teacherCount = profKeys.size
    }

    // Ressources publiques pour ce niveau
    const [resourcesCountRes, templatesCountRes, recentRes] = await Promise.all([
      supabase
        .from('resources')
        .select('id', { count: 'exact', head: true })
        .eq('visibility', 'public')
        .in('matiere_id', matiereIds.length > 0 ? matiereIds : ['00000000-0000-0000-0000-000000000000']),
      supabase
        .from('templates')
        .select('id', { count: 'exact', head: true })
        .or(`filiere_id.is.null,filiere_id.eq.${studentFiliereId}`),
      supabase
        .from('resources')
        .select(`
          id,
          title,
          type,
          file_path,
          created_at,
          matieres(name),
          profiles!resources_uploaded_by_fkey(full_name)
        `)
        .eq('visibility', 'public')
        .in('matiere_id', matiereIds.length > 0 ? matiereIds : ['00000000-0000-0000-0000-000000000000'])
        .order('created_at', { ascending: false })
        .limit(4),
    ])

    availableResources = resourcesCountRes.count ?? 0
    templatesCount = templatesCountRes.count ?? 0
    recentResources = recentRes.data ?? []
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Écoute les ajouts/suppressions de ressources — les compteurs et le flux d'activité se mettent à jour automatiquement */}
      <RealtimeResourcesWatcher />
      {/* Salutation personnalisée */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-heading-2 text-ink">
              Bonjour, {profile?.full_name || 'Étudiant'}
            </h1>
            {filiereData && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-caption font-semibold text-primary">
                <GraduationCap className="h-3.5 w-3.5" />
                {filiereData.code || filiereData.name}
              </span>
            )}
          </div>
          <p className="mt-1 text-body-md text-ink-muted">
            Espace Étudiant · Accédez aux cours, TD, examens et gabarits officiels de votre filière {filiereData?.name ? `(${filiereData.name})` : ''}.
          </p>
        </div>

        <Link
          href="/etudiant/recherche"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-hairline bg-white px-4 text-body-sm font-medium text-ink shadow-level-1 hover:bg-canvas-soft"
        >
          <Search className="h-4 w-4 text-ink-muted" />
          Recherche de cours
        </Link>
      </div>

      {/* Statistiques Étudiant */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Mes Professeurs"
          value={teacherCount}
          subtitle="Enseignants de votre cursus"
          href="/etudiant/profs"
          icon={<UserCheck className="h-4 w-4" />}
          iconBg="bg-accent-purple/20 text-accent-purple-deep"
        />
        <StatsCard
          title="Cours & Ressources"
          value={availableResources}
          subtitle={currentNiveauName ? `Disponibles pour ${currentNiveauName}` : 'Accessibles pour réviser'}
          href="/etudiant/ressources"
          icon={<BookOpen className="h-4 w-4" />}
          iconBg="bg-accent-teal/15 text-accent-teal"
        />
        <StatsCard
          title="Modèles & Exemples Stage"
          value={templatesCount}
          subtitle="CV, lettres, rapports types..."
          href="/etudiant/stages"
          icon={<FileText className="h-4 w-4" />}
          iconBg="bg-accent-orange/15 text-accent-orange-deep"
        />
      </div>

      {/* Flux d'activité : Dernières ressources publiées */}
      <div className="rounded-xl border border-hairline bg-white p-6 shadow-level-1">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div>
            <h2 className="text-title font-semibold text-ink flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Dernières ressources publiées
            </h2>
            <p className="mt-0.5 text-caption text-ink-muted">
              Nouveaux cours et TD mis à disposition pour votre niveau
            </p>
          </div>
          <Link
            href="/etudiant/ressources"
            className="flex items-center gap-1 text-caption font-medium text-primary hover:underline"
          >
            Tout voir <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-4">
          {recentResources.length === 0 ? (
            <p className="py-6 text-center text-body-sm text-ink-muted">
              Aucune ressource n'a encore été publiée pour votre niveau cette année.
            </p>
          ) : (
            <ul className="divide-y divide-hairline">
              {recentResources.map((res) => (
                <li key={res.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-accent-teal/15 p-2 text-accent-teal">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-ink text-body-sm">{res.title}</p>
                      <p className="text-caption text-ink-muted flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-ink-secondary">{res.matieres?.name}</span>
                        <span>·</span>
                        <span>{res.profiles?.full_name || 'Enseignant'}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-ink-faint">
                          <Clock className="h-3 w-3" />
                          {new Date(res.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/etudiant/ressources`}
                    className="inline-flex items-center gap-1 text-caption font-medium text-primary hover:underline"
                  >
                    Consulter <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Raccourcis cartes */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/etudiant/profs"
          className="group rounded-lg border border-hairline bg-white p-6 shadow-level-1 transition hover:shadow-level-2"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-accent-purple/15 p-2 text-accent-purple-deep">
              <UserCheck className="h-5 w-5" />
            </span>
            <ArrowRight className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-1" />
          </div>
          <h2 className="mt-4 text-heading-3 text-ink">Mes Profs</h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Consultez la liste des professeurs assignés à vos matières et accédez directement à leurs cours.
          </p>
        </Link>

        <Link
          href="/etudiant/stages"
          className="group rounded-lg border border-hairline bg-white p-6 shadow-level-1 transition hover:shadow-level-2"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-accent-teal/15 p-2 text-accent-teal">
              <Briefcase className="h-5 w-5" />
            </span>
            <ArrowRight className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-1" />
          </div>
          <h2 className="mt-4 text-heading-3 text-ink">Mon Espace Stage</h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Consultez des exemples de rapports validés de votre filière et téléchargez les gabarits Word et LaTeX.
          </p>
        </Link>
      </div>
    </div>
  )
}

function StatsCard({
  title,
  value,
  subtitle,
  href,
  icon,
  iconBg,
}: {
  title: string
  value: number
  subtitle?: string
  href: string
  icon: React.ReactNode
  iconBg: string
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-hairline bg-white p-6 transition-shadow hover:shadow-level-1"
    >
      <div className="flex items-center justify-between">
        <p className="text-body-sm font-medium text-ink-muted">{title}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${iconBg}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-heading-1 text-ink">{value}</p>
      {subtitle && (
        <p className="mt-1 text-caption text-ink-faint">{subtitle}</p>
      )}
    </Link>
  )
}
