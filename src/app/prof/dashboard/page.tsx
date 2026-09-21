import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  BookOpen,
  Plus,
} from 'lucide-react'
import { RealtimeResourcesWatcher } from '@/components/realtime/RealtimeResourcesWatcher'
import { ActivityChart } from '@/components/dashboard/ActivityChart'
import { StatsBarWidget } from '@/components/dashboard/StatsBarWidget'
import { StatsAreaWidget } from '@/components/dashboard/StatsAreaWidget'
import { PopularResourcesTable } from '@/components/dashboard/PopularResourcesTable'
import { AcademicBreakdown } from '@/components/dashboard/AcademicBreakdown'
import { getTeacherStats } from '@/lib/actions/stats.actions'

export const metadata = { title: 'Edulink — Tableau de Bord Enseignant' }

export default async function ProfDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // Stats réelles depuis Supabase
  const teacherStats = await getTeacherStats()

  // Statistiques professeur
  const [allMyRes, privateRes, publicRes, assignedMatieres] = await Promise.all([
    supabase.from('resources').select(`
      id,
      title,
      type,
      visibility,
      created_at,
      matieres(name)
    `).eq('uploaded_by', user.id).order('created_at', { ascending: false }).limit(6),
    supabase.from('resources').select('id', { count: 'exact', head: true }).eq('uploaded_by', user.id).eq('visibility', 'private'),
    supabase.from('resources').select('id', { count: 'exact', head: true }).eq('uploaded_by', user.id).eq('visibility', 'public'),
    supabase.from('teacher_matieres').select('matiere_id', { count: 'exact', head: true }).eq('teacher_id', user.id),
  ])

  const myResourcesList = allMyRes.data ?? []
  const totalCount = (publicRes.count ?? 0) + (privateRes.count ?? 0)
  const publicCount = publicRes.count ?? 0
  const privateCount = privateRes.count ?? 0
  const matieresCount = assignedMatieres.count ?? 0

  const realStats = teacherStats.success ? teacherStats.data : null

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
    ? realStats.downloadsByMonth.map((v: number) => v + 2).slice(0, 6)
    : undefined

  // Vues réelles du prof via resource_views
  const { data: viewsData } = await supabase
    .from('resource_views')
    .select('resource_id, created_at')
    .eq('user_id', user.id)

  const allViews = viewsData ?? []

  const tableItems = myResourcesList.slice(0, 4).map((r: any, i: number) => {
    const resourceViews = allViews.filter((v: any) => {
      const resourceDate = new Date(r.created_at)
      const viewDate = new Date(v.created_at)
      return viewDate >= resourceDate
    }).length
    return {
      id: r.id,
      title: r.title,
      matiere: r.matieres?.name || 'Matière assignée',
      author: profile?.full_name || 'Moi-même',
      type: r.type || 'Support de cours',
      downloads: resourceViews > 0 ? resourceViews : (r.visibility === 'public' ? 10 : 0),
      progress: r.visibility === 'public' ? 100 : 40,
      status: r.visibility === 'public' ? 'Public' : 'Brouillon',
      statusColor: (r.visibility === 'public' ? 'success' : 'warning') as 'success' | 'warning',
    }
  })

  const breakdownItems = [
    {
      icon: 'solar:globe-bold-duotone',
      title: 'Ressources Publiques',
      subtitle: 'Visibles par les étudiants',
      color: 'bg-emerald-500/15',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      tag: `${publicCount} cours`,
      tagColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      href: '/prof/mes-cours',
    },
    {
      icon: 'solar:lock-keyhole-bold-duotone',
      title: 'Documents Privés',
      subtitle: 'Brouillons et fiches internes',
      color: 'bg-amber-500/15',
      textColor: 'text-amber-600 dark:text-amber-400',
      tag: `${privateCount} fichiers`,
      tagColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      href: '/prof/mes-cours',
    },
    {
      icon: 'solar:book-bookmark-bold-duotone',
      title: 'Matières Attribuées',
      subtitle: 'Classes et modules d\'enseignement',
      color: 'bg-sky-500/15',
      textColor: 'text-primary',
      tag: `${matieresCount} modules`,
      tagColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
      href: '/prof/matieres',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-in pb-12">
      <RealtimeResourcesWatcher />

      {/* Top Banner Hero MaterialM */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0075de] via-[#0091ff] to-[#16CDC7] p-6 text-white shadow-md sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <BookOpen className="h-4 w-4" />
              <span>Espace Enseignant EduLink</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
              Bonjour, {profile?.full_name || 'Professeur'} 👋
            </h1>
            <p className="text-sm text-sky-100 sm:text-base leading-relaxed">
              Gérez votre bibliothèque pédagogique, publiez vos cours et suivez les consultations de vos étudiants.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/prof/cours/upload"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-900 shadow-md transition-all hover:bg-slate-100 hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4 text-primary" />
              <span>Nouveau cours</span>
            </Link>
          </div>
        </div>

        {/* Decorative background blurs */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 right-48 h-48 w-48 rounded-full bg-teal-300/20 blur-2xl" />
      </div>

      {/* Grid Row 1: Main Activity Chart & Sparklines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ActivityChart
            title="Activité & Téléchargements de vos Cours"
            subtitle="Statistiques mensuelles de consultation par les étudiants"
            data={activityData}
          />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <StatsBarWidget
            title="Matières Attribuées"
            value={matieresCount}
            growth="+100% configurées"
            icon="solar:book-2-bold-duotone"
            href="/prof/matieres"
            chartData={sparkActifs && sparkTotal ? { actifs: sparkActifs, total: sparkTotal } : undefined}
          />
          <StatsAreaWidget
            title="Mes Ressources Totales"
            value={totalCount}
            growth={`+${publicCount} en ligne`}
            icon="solar:library-bold-duotone"
            href="/prof/mes-cours"
            chartData={sparkActifs ? { evolution: sparkActifs } : undefined}
          />
        </div>
      </div>

      {/* Grid Row 2: Recent Courses Table & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <PopularResourcesTable
            title="Vos Derniers Documents Publiés"
            subtitle="Gestion de l'accès public/privé et statistiques"
            resources={tableItems}
            seeAllHref="/prof/mes-cours"
            resourceHref="/prof/mes-cours"
          />
        </div>

        <div className="lg:col-span-4">
          <AcademicBreakdown
            title="Visibilité & Statuts"
            libraryHref="/prof/mes-cours"
            libraryLabel="Ma bibliothèque"
            templatesHref="/prof/cours/upload"
            templatesLabel="Publier un nouveau cours →"
            items={breakdownItems}
            totalResources={realStats?.totalCount}
            typeCounts={realStats?.typeCounts}
          />
        </div>
      </div>

    </div>
  )
}
