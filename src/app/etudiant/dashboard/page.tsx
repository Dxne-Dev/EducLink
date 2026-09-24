import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  BookOpen,
  Search,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import { RealtimeResourcesWatcher } from '@/components/realtime/RealtimeResourcesWatcher'
import { ActivityChart } from '@/components/dashboard/ActivityChart'
import { StatsBarWidget } from '@/components/dashboard/StatsBarWidget'
import { StatsAreaWidget } from '@/components/dashboard/StatsAreaWidget'
import { PopularResourcesTable } from '@/components/dashboard/PopularResourcesTable'
import { AcademicBreakdown } from '@/components/dashboard/AcademicBreakdown'
import { ResourceCardGrid } from '@/components/dashboard/ResourceCardGrid'
import { getStudentStats } from '@/lib/actions/stats.actions'

export const metadata = { title: 'Edulink - Tableau de Bord Étudiant' }

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

  // Stats réelles depuis Supabase
  const studentStats = await getStudentStats(
    studentFiliereId ?? undefined,
    studentNiveauId ?? undefined,
    profile?.promo_id ?? undefined
  )
  const realStats = studentStats.success ? studentStats.data : null

  const activityData = realStats
    ? realStats.months.map((_, i) => ({
        downloads: realStats.downloadsByMonth[i] ?? 0,
        consultations: realStats.consultationsByMonth[i] ?? 0,
      }))
    : undefined

  const sparkActifs = realStats
    ? realStats.downloadsByMonth.slice(0, 6)
    : undefined
  const sparkTotal = realStats
    ? realStats.downloadsByMonth.map((v: number) => v + 1).slice(0, 6)
    : undefined

  let teacherCount = 0
  let availableResources = 0
  let templatesCount = 0
  let rawResources: any[] = []

  if (studentFiliereId && studentNiveauId) {
    const { data: matieres } = await supabase
      .from('matieres')
      .select('id, name, code')
      .eq('niveau_id', studentNiveauId)

    const matiereIds = matieres?.map((m) => m.id) ?? []

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
        .limit(6),
    ])

    availableResources = resourcesCountRes.count ?? 0
    templatesCount = templatesCountRes.count ?? 0
    rawResources = recentRes.data ?? []
  }

  // Vues réelles de l'étudiant via resource_views
  const { data: viewsData } = await supabase
    .from('resource_views')
    .select('resource_id, created_at')
    .eq('user_id', user.id)

  const allViews = viewsData ?? []

  const tableItems = rawResources.slice(0, 4).map((r, i) => {
    const resourceViews = allViews.filter((v: any) => {
      const resourceDate = new Date(r.created_at)
      const viewDate = new Date(v.created_at)
      return viewDate >= resourceDate
    }).length
    return {
      id: r.id,
      title: r.title,
      matiere: r.matieres?.name || 'Matière générale',
      author: r.profiles?.full_name || 'Professeur',
      type: r.type || 'Support de cours',
      downloads: resourceViews > 0 ? resourceViews : 0,
      progress: Math.min(100, 50 + (i * 15)),
      status: i === 0 ? 'Recommandé' : i === 1 ? 'Nouveau' : 'Disponible',
      statusColor: (i === 0 ? 'success' : i === 1 ? 'primary' : 'warning') as 'success' | 'primary' | 'warning',
    }
  })

  // Ressources réelles étudiant pour la carte grid
  const studentCardGradients = ['from-blue-600 to-indigo-700', 'from-teal-600 to-emerald-700', 'from-amber-600 to-orange-700']
  const studentCardItems = (rawResources ?? []).slice(0, 3).map((r: any, i: number) => ({
    id: r.id,
    title: r.title,
    category: r.type ?? 'Cours',
    author: r.profiles?.full_name ?? 'Professeur',
    views: allViews.filter((v: any) => v.resource_id === r.id).length,
    downloads: '—',
    date: new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    href: `/etudiant/ressources`,
    gradient: studentCardGradients[i % studentCardGradients.length],
  }))

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-in pb-12">
      <RealtimeResourcesWatcher />

      {/* Top Banner Hero MaterialM */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0075de] via-[#0091ff] to-[#16CDC7] p-6 text-white shadow-md sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <GraduationCap className="h-4 w-4" />
              <span>{filiereData?.name || 'Étudiant EduLink'} {currentNiveauName ? `· ${currentNiveauName}` : ''}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
              Bonjour, {profile?.full_name || 'Étudiant'} 👋
            </h1>
            <p className="text-sm text-sky-100 sm:text-base leading-relaxed">
              Consultez vos cours en ligne, suivez l'activité pédagogique de votre promotion et accédez à vos gabarits de stage.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/etudiant/ressources"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-900 shadow-md transition-all hover:bg-slate-100 hover:scale-105 active:scale-95"
            >
              <BookOpen className="h-4 w-4 text-primary" />
              <span>Accéder à mes cours</span>
            </Link>
          </div>
        </div>

        {/* Decorative background blurs */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 right-48 h-48 w-48 rounded-full bg-teal-300/20 blur-2xl" />
      </div>

      {/* Grid Row 1: Main Chart (8 cols) & 2 Sparkline Widgets (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ActivityChart
            title="Activité & Fréquentation des Cours"
            subtitle="Volume des téléchargements et des consultations par mois"
            data={activityData}
          />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <StatsBarWidget
            title="Mes Professeurs"
            value={teacherCount}
            growth="+100% assignés"
            icon="solar:users-group-rounded-bold-duotone"
            href="/etudiant/profs"
            chartData={sparkActifs && sparkTotal ? { actifs: sparkActifs, total: sparkTotal } : undefined}
          />
          <StatsAreaWidget
            title="Ressources Disponibles"
            value={availableResources}
            growth={`+${availableResources} supports`}
            icon="solar:book-bookmark-bold-duotone"
            href="/etudiant/ressources"
            chartData={sparkActifs ? { evolution: sparkActifs } : undefined}
          />
        </div>
      </div>

      {/* Grid Row 2: Popular Table (8 cols) & Breakdown Widget (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <PopularResourcesTable
            title="Derniers Supports Pédagogiques Publiés"
            subtitle="Documents les plus récents et plébiscités pour votre niveau"
            resources={tableItems}
            seeAllHref="/etudiant/ressources"
            resourceHref="/etudiant/ressources"
          />
        </div>

        <div className="lg:col-span-4">
          <AcademicBreakdown
            title="Répartition des Contenus"
            totalResources={realStats?.totalCount}
            typeCounts={realStats?.typeCounts}
          />
        </div>
      </div>

      {/* Grid Row 3: Card Grid (12 cols) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Ressources et Guides Recommandés
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sélection de cours magistraux, fiches pratiques et gabarits de mémoire
            </p>
          </div>
          <Link
            href="/etudiant/ressources"
            className="text-xs font-semibold text-primary hover:underline dark:text-sky-400"
          >
            Explorer toute la bibliothèque →
          </Link>
        </div>

        <ResourceCardGrid cards={studentCardItems} />
      </div>
    </div>
  )
}