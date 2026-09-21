import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Users,
  GraduationCap,
  Building2,
  BookMarked,
  Award,
  FileText,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { ActivityChart } from '@/components/dashboard/ActivityChart'
import { StatsBarWidget } from '@/components/dashboard/StatsBarWidget'
import { StatsAreaWidget } from '@/components/dashboard/StatsAreaWidget'
import { AcademicBreakdown } from '@/components/dashboard/AcademicBreakdown'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HiOutlineDotsVertical } from 'react-icons/hi'
import { Icon } from '@iconify/react'
import { getAdminStats } from '@/lib/actions/stats.actions'

export const metadata = { title: 'Edulink - Tableau de bord Administration' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Stats réelles admin
  const adminStats = await getAdminStats()
  const realStats = adminStats.success ? adminStats.data : null

  // Récupération globale des statistiques
  const [
    studentsRes,
    teachersProfileRes,
    teacherRegistryRes,
    filieresRes,
    promotionsRes,
    matieresRes,
    resourcesRes,
    templatesRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('teacher_registry').select('id, is_used', { count: 'exact' }),
    supabase.from('filieres').select('id, name, code'),
    supabase.from('promotions').select('id, name, is_active, year_start, year_end, filieres(name), niveaux(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('matieres').select('id', { count: 'exact', head: true }),
    supabase.from('resources').select('id', { count: 'exact', head: true }),
    supabase.from('templates').select('id', { count: 'exact', head: true }),
  ])

  const studentCount = studentsRes.count ?? 0
  const activeTeachersCount = teachersProfileRes.count ?? 0
  const registryTeachers = teacherRegistryRes.data ?? []
  const filieresList = filieresRes.data ?? []
  const recentPromotions = promotionsRes.data ?? []
  const matiereCount = matieresRes.count ?? 0
  const resourceCount = resourcesRes.count ?? 0
  const templatesCount = templatesRes.count ?? 0

  const chartData = realStats
    ? realStats.months.map((_, i) => ({
        downloads: realStats.registrationsByMonth[i] ?? 0,
        consultations: realStats.coursesByMonth[i] ?? 0,
      }))
    : undefined

  const sparkActifs = realStats
    ? realStats.registrationsByMonth.slice(0, 6)
    : undefined
  const sparkTotal = realStats
    ? realStats.coursesByMonth.map((v: number) => v + 5).slice(0, 6)
    : undefined

  const academicBreakdown = [
    {
      icon: 'solar:diploma-verified-bold-duotone',
      title: 'Filières Actives',
      subtitle: `${filieresList.length} cursus académiques`,
      color: 'bg-primary/15',
      textColor: 'text-primary',
      tag: `${filieresList.length} filières`,
      tagColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
      href: '/admin/filieres',
    },
    {
      icon: 'solar:book-bookmark-bold-duotone',
      title: 'Matières & Modules',
      subtitle: 'Réparties sur tous les niveaux',
      color: 'bg-teal-500/15',
      textColor: 'text-teal-600 dark:text-teal-400',
      tag: `${matiereCount} matières`,
      tagColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      href: '/admin/matieres',
    },
    {
      icon: 'solar:user-id-bold-duotone',
      title: 'Enseignants Habilités',
      subtitle: `${activeTeachersCount} comptes professeurs actifs`,
      color: 'bg-amber-500/15',
      textColor: 'text-amber-600 dark:text-amber-400',
      tag: `${registryTeachers.length} inscrits`,
      tagColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      href: '/admin/teachers',
    },
    {
      icon: 'solar:clipboard-check-bold-duotone',
      title: 'Gabarits & Guides',
      subtitle: templatesCount > 0 ? `${templatesCount} documents en libre-service` : 'Aucun document déposé',
      color: 'bg-rose-500/15',
      textColor: 'text-rose-600 dark:text-rose-400',
      tag: templatesCount > 0 ? `${templatesCount} gabarits` : 'À alimenter',
      tagColor: templatesCount > 0 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      href: '/admin/rapports',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-fade-in pb-12">
      {/* Top Banner Hero MaterialM */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0075de] via-[#0091ff] to-[#16CDC7] p-6 text-white shadow-md sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>Console d'Administration Globale</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
              Supervision Académique EduLink 🛡️
            </h1>
            <p className="text-sm text-sky-100 sm:text-base leading-relaxed">
              Supervisez les promotions, gérez l'arborescence des matières LMD, habilitez les enseignants et publiez les gabarits de stage.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/admin/promotions"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-900 shadow-md transition-all hover:bg-slate-100 hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4 text-primary" />
              <span>Nouvelle Promotion</span>
            </Link>
          </div>
        </div>

        {/* Decorative background blurs */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 right-48 h-48 w-48 rounded-full bg-teal-300/20 blur-2xl" />
      </div>

      {/* Grid Row 1: Global Activity Chart & Sparklines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ActivityChart
            title="Activité & Fréquentation de la Plateforme"
            subtitle="Inscriptions, cours déposés et consultations mensuelles"
            data={chartData}
            seriesNames={{ downloads: 'Inscriptions', consultations: 'Cours déposés' }}
          />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <StatsBarWidget
            title="Étudiants Inscrits"
            value={studentCount}
            growth={`+${studentCount} actifs`}
            icon="solar:users-group-two-rounded-bold-duotone"
            href="/admin/users"
            chartData={sparkActifs && sparkTotal ? { actifs: sparkActifs, total: sparkTotal } : undefined}
          />
          <StatsAreaWidget
            title="Ressources Publiées"
            value={resourceCount}
            growth={`+${resourceCount} au total`}
            icon="solar:folder-with-files-bold-duotone"
            href="/admin/rapports"
            chartData={sparkActifs ? { evolution: sparkActifs } : undefined}
          />
        </div>
      </div>

      {/* Grid Row 2: Recent Promotions Table & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="relative w-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Promotions Récentes</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Suivi des cohortes et de leur niveau actuel</p>
              </div>

              <Link
                href="/admin/promotions"
                className="text-xs font-semibold text-primary hover:underline dark:text-sky-400"
              >
                Gérer toutes les promotions →
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 dark:border-slate-800">
                    <TableHead className="text-xs font-bold uppercase text-slate-400">Promotion</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-slate-400">Filière / Niveau</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-slate-400">Statut</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {recentPromotions.map((p: any) => (
                    <TableRow
                      key={p.id}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-slate-800/60 dark:hover:bg-slate-800/30"
                    >
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-300 font-bold text-xs">
                            <Icon icon="solar:buildings-3-bold-duotone" height={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {p.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Année : {p.year_start} - {p.year_end}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5">
                        <div className="text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {p.filieres?.name ?? 'Non définie'}
                          </span>
                          <span className="text-slate-400"> • </span>
                          <span className="font-semibold text-primary dark:text-sky-400">
                            {p.niveaux?.name ?? 'N/A'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            p.is_active
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50'
                          }`}
                        >
                          {p.is_active ? 'Active' : 'Archivée'}
                        </span>
                      </TableCell>

                      <TableCell className="py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                              <HiOutlineDotsVertical size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href="/admin/promotions">Voir la promotion</Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <AcademicBreakdown
            title="Synthèse Globale"
            libraryHref="/admin/rapports"
            libraryLabel="Gérer les gabarits & ressources"
            templatesHref="/admin/rapports"
            templatesLabel="Gérer les gabarits de stages →"
            items={academicBreakdown.map((i) => ({ ...i, tag: i.tag }))}
            totalResources={realStats?.totalResources}
            typeCounts={realStats?.typeCounts}
          />
        </div>
      </div>

      {/* Grid Row 3: Quick Access Administrative Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Link
          href="/admin/matieres"
          className="group block rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:-translate-y-1.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-600 dark:bg-teal-500/25 dark:text-teal-400">
              <Icon icon="solar:book-bookmark-bold-duotone" height={26} />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
          </div>
          <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
            Arborescence Matières
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Configurez les cours, TD et coefficients rattachés à chaque niveau LMD.
          </p>
        </Link>

        <Link
          href="/admin/teachers"
          className="group block rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:-translate-y-1.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/25 dark:text-amber-400">
              <Icon icon="solar:user-check-bold-duotone" height={26} />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
          </div>
          <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
            Habilitation Enseignants
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Attribuez les matières aux professeurs et gérez les clés d'enregistrement.
          </p>
        </Link>

        <Link
          href="/admin/rapports"
          className="group block rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:-translate-y-1.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 dark:bg-rose-500/25 dark:text-rose-400">
              <Icon icon="solar:document-medicine-bold-duotone" height={26} />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
          </div>
          <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
            Gabarits & Ressources de Stage
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Déposez les gabarits Word/LaTeX, guides méthodologiques et documents officiels accessibles aux étudiants selon leur filière.
          </p>
        </Link>
      </div>
    </div>
  )
}