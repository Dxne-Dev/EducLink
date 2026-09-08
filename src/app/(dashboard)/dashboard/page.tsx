import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ROLE_LABELS } from '@/lib/constants'
import type { UserRole } from '@/types/database'
import { BookOpen, FileText, Briefcase, Building2, Sparkles, Library, Plus, FileUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user!.id)
    .single()

  const [resourceCount, reportCount, templateCount, promoCount] = await Promise.all([
    supabase.from('resources').select('*', { count: 'exact', head: true }).eq('status', 'validated'),
    supabase.from('internship_reports').select('*', { count: 'exact', head: true }).eq('is_validated', true),
    supabase.from('templates').select('*', { count: 'exact', head: true }),
    supabase.from('promotions').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const role = (profile?.role ?? 'student') as UserRole
  const isAdmin = role === 'admin'
  const isTeacher = role === 'teacher'

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-heading-2 text-ink">
          Bonjour, {profile?.full_name}
        </h1>
        <p className="mt-1 text-body-md text-ink-muted">
          {ROLE_LABELS[role]} · Voici un aperçu de la plateforme Edulink.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Ressources validées" value={resourceCount.count ?? 0} href="/dashboard/cours" icon={<BookOpen className="h-4 w-4" />} iconBg="bg-accent-purple/20 text-accent-purple-deep" />
        <StatsCard title="Rapports de stage" value={reportCount.count ?? 0} href="/dashboard/stages" icon={<Briefcase className="h-4 w-4" />} iconBg="bg-accent-teal/15 text-accent-teal" />
        <StatsCard title="Modèles disponibles" value={templateCount.count ?? 0} href="/dashboard/templates" icon={<FileText className="h-4 w-4" />} iconBg="bg-accent-orange/15 text-accent-orange-deep" />
        <StatsCard title="Promotions actives" value={promoCount.count ?? 0} href="/admin/promotions" icon={<Building2 className="h-4 w-4" />} iconBg="bg-accent-pink/15 text-accent-pink" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/recherche"
          className="rounded-lg border border-hairline bg-white p-6 shadow-level-1 transition hover:shadow-level-2"
        >
          <h2 className="text-heading-3 text-ink">Recherche intelligente</h2>
          <p className="mt-2 text-body-sm text-ink-muted">
            Trouvez un cours, un examen ou une fiche en langage naturel.
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Essayer
          </span>
        </Link>
        <Link
          href="/dashboard/cours"
          className="rounded-lg border border-hairline bg-white p-6 shadow-level-1 transition hover:shadow-level-2"
        >
          <h2 className="text-heading-3 text-ink">Cours & Ressources</h2>
          <p className="mt-2 text-body-sm text-ink-muted">
            Parcourez les cours, fiches et examens par filière, niveau et matière.
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-medium text-primary">
            <Library className="h-4 w-4" />
            Parcourir
          </span>
        </Link>
      </div>

      {(isAdmin || isTeacher) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-heading-3">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/cours/upload"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-body-md font-medium text-white shadow-level-1"
            >
              <Plus className="h-4 w-4" />
              Ajouter une ressource
            </Link>
            <Link
              href="/dashboard/templates"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-hairline bg-white px-4 text-body-sm font-medium text-ink"
            >
              <FileUp className="h-4 w-4" />
              Gérer les modèles
            </Link>
            {isAdmin && (
              <Link
                href="/admin/rapports"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-hairline bg-white px-4 text-body-sm font-medium text-ink"
              >
                <FileText className="h-4 w-4" />
                Valider des rapports
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatsCard({
  title,
  value,
  href,
  icon,
  iconBg,
}: {
  title: string
  value: number
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
    </Link>
  )
}