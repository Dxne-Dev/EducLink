import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import {
  Users,
  GraduationCap,
  Building2,
  BookMarked,
  Award,
  FileText,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'

export const metadata = { title: 'Edulink - Tableau de bord Administration' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Récupération globale des statistiques
  const [
    studentsRes,
    teachersProfileRes,
    teacherRegistryRes,
    filieresRes,
    promotionsRes,
    matieresRes,
    resourcesRes,
    reportsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('teacher_registry').select('id, is_used', { count: 'exact' }),
    supabase.from('filieres').select('id, name, code'),
    supabase.from('promotions').select('id, name, is_active, year_start, year_end, filieres(name), niveaux(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('matieres').select('id', { count: 'exact', head: true }),
    supabase.from('resources').select('id', { count: 'exact', head: true }),
    supabase.from('internship_reports').select('id, is_validated'),
  ])

  const studentCount = studentsRes.count ?? 0
  const activeTeachersCount = teachersProfileRes.count ?? 0
  const registryTeachers = teacherRegistryRes.data ?? []
  const filieresList = filieresRes.data ?? []
  const recentPromotions = promotionsRes.data ?? []
  const matiereCount = matieresRes.count ?? 0
  const resourceCount = resourcesRes.count ?? 0
  const reportsList = reportsRes.data ?? []
  const pendingReports = reportsList.filter((r) => !r.is_validated).length

  const stats = [
    {
      title: 'Étudiants Inscrits',
      value: studentCount,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
      href: '/admin/users',
      description: 'Comptes étudiants actifs',
    },
    {
      title: 'Enseignants Habilités',
      value: registryTeachers.length,
      subvalue: `${activeTeachersCount} actifs`,
      icon: Award,
      color: 'text-accent-orange-deep',
      bg: 'bg-accent-orange/15',
      href: '/admin/teachers',
      description: 'Registre académique',
    },
    {
      title: 'Filières de formation',
      value: filieresList.length,
      icon: GraduationCap,
      color: 'text-accent-purple-deep',
      bg: 'bg-accent-purple/15',
      href: '/admin/filieres',
      description: 'Cursus universitaires',
    },
    {
      title: 'Matières au programme',
      value: matiereCount,
      icon: BookMarked,
      color: 'text-accent-teal',
      bg: 'bg-accent-teal/15',
      href: '/admin/matieres',
      description: 'Réparties par niveaux',
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-heading-2 text-ink">Administration</h1>
            <Badge variant="purple" className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Espace Sécurisé
            </Badge>
          </div>
          <p className="mt-1 text-body-sm text-ink-muted">
            Gestion globale du cursus académique LMD, des filières, promotions et enseignants.
          </p>
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.title} href={s.href} className="group transition-all hover:scale-[1.01]">
              <Card className="h-full border-hairline transition-colors group-hover:border-primary/40">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm font-medium text-ink-muted">{s.title}</span>
                    <div className={`rounded-lg p-2.5 ${s.bg} ${s.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-heading-1 font-bold text-ink">{s.value}</span>
                    {s.subvalue && (
                      <span className="text-caption font-medium text-ink-muted">({s.subvalue})</span>
                    )}
                  </div>
                  <p className="mt-1 text-caption text-ink-faint">{s.description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Grille principale : Actions rapides & Dernières promotions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Dernières promotions actives */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-title">Promotions Récentes</CardTitle>
                <CardDescription>Suivi des promotions et de leur niveau actuel</CardDescription>
              </div>
              <Link
                href="/admin/promotions"
                className="flex items-center gap-1 text-body-sm font-medium text-primary hover:underline"
              >
                Gérer tout <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentPromotions.length === 0 ? (
                <div className="py-8 text-center text-body-sm text-ink-muted">
                  Aucune promotion configurée pour le moment.
                </div>
              ) : (
                <ul className="divide-y divide-hairline">
                  {recentPromotions.map((p: any) => (
                    <li key={p.id} className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-content-center rounded-lg bg-canvas-soft text-ink-secondary">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-ink">{p.name}</p>
                            {p.is_active ? (
                              <Badge variant="success" className="text-[10px] py-0">Actif</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] py-0">Terminé</Badge>
                            )}
                          </div>
                          <p className="text-caption text-ink-muted">
                            Filière : {p.filieres?.name ?? 'Non définie'} · Niveau actuel : <span className="font-semibold text-primary">{p.niveaux?.name ?? 'N/A'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-caption text-ink-faint">
                          {p.year_start} - {p.year_end}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Raccourcis pédagogiques LMD */}
          <Card className="bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="text-title flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Flux académique LMD : Rappel du cycle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-body-sm text-ink-secondary">
              <div className="grid gap-3 sm:grid-cols-3 text-caption">
                <div className="rounded-lg border border-hairline bg-white p-3 shadow-xs">
                  <p className="font-semibold text-ink">1. Filière & Niveaux</p>
                  <p className="mt-1 text-ink-muted">Chaque filière contient ses niveaux (L1, L2, L3...).</p>
                </div>
                <div className="rounded-lg border border-hairline bg-white p-3 shadow-xs">
                  <p className="font-semibold text-ink">2. Matières & Enseignants</p>
                  <p className="mt-1 text-ink-muted">Les professeurs sont affectés aux matières de leur expertise.</p>
                </div>
                <div className="rounded-lg border border-hairline bg-white p-3 shadow-xs">
                  <p className="font-semibold text-ink">3. Promo & Passage</p>
                  <p className="mt-1 text-ink-muted">Chaque année, la promo change de niveau et hérite de ses cours.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne latérale : Accès rapides & Documents */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-title">Actions Rapides</CardTitle>
              <CardDescription>Raccourcis de gestion administrative</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/admin/matieres"
                className="flex items-center justify-between rounded-md border border-hairline p-3 transition-colors hover:bg-canvas-soft"
              >
                <div className="flex items-center gap-3">
                  <BookMarked className="h-4 w-4 text-accent-teal" />
                  <span className="text-body-sm font-medium text-ink">Arborescence Matières</span>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-faint" />
              </Link>
              <Link
                href="/admin/teachers"
                className="flex items-center justify-between rounded-md border border-hairline p-3 transition-colors hover:bg-canvas-soft"
              >
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-accent-orange-deep" />
                  <span className="text-body-sm font-medium text-ink">Affecter Enseignants</span>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-faint" />
              </Link>
              <Link
                href="/admin/promotions"
                className="flex items-center justify-between rounded-md border border-hairline p-3 transition-colors hover:bg-canvas-soft"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-body-sm font-medium text-ink">Passage de Niveau</span>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-faint" />
              </Link>
              <Link
                href="/admin/rapports"
                className="flex items-center justify-between rounded-md border border-hairline p-3 transition-colors hover:bg-canvas-soft"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-ink-muted" />
                  <span className="text-body-sm font-medium text-ink">Rapports de stage</span>
                </div>
                {pendingReports > 0 ? (
                  <Badge variant="warning" className="text-[10px] py-0">{pendingReports} en attente</Badge>
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-accent-teal" />
                )}
              </Link>
            </CardContent>
          </Card>

          {/* Synthèse Contenus */}
          <Card>
            <CardHeader>
              <CardTitle className="text-title">Bibliothèque & Dépôts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-ink-muted">Ressources publiées</span>
                <span className="font-semibold text-ink">{resourceCount}</span>
              </div>
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-ink-muted">Rapports de stages</span>
                <span className="font-semibold text-ink">{reportsList.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
