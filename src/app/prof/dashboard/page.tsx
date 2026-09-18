import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  BookOpen,
  Plus,
  Building2,
  Lock,
  Globe,
  ArrowRight,
  Library,
  BookMarked,
  Sparkles,
} from 'lucide-react'
import { RealtimeResourcesWatcher } from '@/components/realtime/RealtimeResourcesWatcher'

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

  // Statistiques professeur
  const [allMyRes, privateRes, publicRes, assignedMatieres] = await Promise.all([
    supabase.from('resources').select('id, promo_id', { count: 'exact' }).eq('uploaded_by', user.id),
    supabase.from('resources').select('id', { count: 'exact' }).eq('uploaded_by', user.id).eq('visibility', 'private'),
    supabase.from('resources').select('id', { count: 'exact' }).eq('uploaded_by', user.id).eq('visibility', 'public'),
    supabase.from('teacher_matieres').select('matiere_id', { count: 'exact' }).eq('teacher_id', user.id),
  ])

  const distinctPromos = new Set(allMyRes.data?.map((r) => r.promo_id) ?? [])

  const teacherData = {
    myResourcesCount: allMyRes.count ?? 0,
    privateCount: privateRes.count ?? 0,
    publicCount: publicRes.count ?? 0,
    distinctPromos: distinctPromos.size,
    matieresCount: assignedMatieres.count ?? 0,
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Écoute les changements en temps réel — met à jour les compteurs et stats automatiquement */}
      <RealtimeResourcesWatcher />
      {/* Salutation personnalisée */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-heading-2 text-ink">
              Bonjour, {profile?.full_name}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-caption font-semibold text-primary">
              Enseignant
            </span>
          </div>
          <p className="mt-1 text-body-md text-ink-muted">
            Gérez vos cours, vos examens, vos matières assignées et le partage multi-promotions.
          </p>
        </div>

        <Link
          href="/prof/cours/upload"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-body-md font-medium text-white shadow-level-1 hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          Nouveau cours
        </Link>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Mes Ressources au total"
          value={teacherData.myResourcesCount}
          subtitle="Tous formats confondus"
          href="/prof/mes-cours"
          icon={<BookOpen className="h-4 w-4" />}
          iconBg="bg-accent-purple/20 text-accent-purple-deep"
        />
        <StatsCard
          title="Ressources Publiques"
          value={teacherData.publicCount}
          subtitle="Visibles par vos étudiants"
          href="/prof/mes-cours?visibility=public"
          icon={<Globe className="h-4 w-4" />}
          iconBg="bg-emerald-100 text-emerald-700"
        />
        <StatsCard
          title="Brouillons / Privées"
          value={teacherData.privateCount}
          subtitle="Visibles uniquement par vous"
          href="/prof/mes-cours?visibility=private"
          icon={<Lock className="h-4 w-4" />}
          iconBg="bg-canvas-soft text-ink-muted"
        />
        <StatsCard
          title="Matières Attribuées"
          value={teacherData.matieresCount}
          subtitle="Configurées par l'admin"
          href="/prof/matieres"
          icon={<BookMarked className="h-4 w-4" />}
          iconBg="bg-accent-teal/15 text-accent-teal"
        />
      </div>

      {/* Raccourcis d'actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/prof/cours/upload"
          className="group rounded-lg border border-hairline bg-white p-6 shadow-level-1 transition hover:shadow-level-2"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-primary/10 p-2 text-primary">
              <Plus className="h-5 w-5" />
            </span>
            <ArrowRight className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-1" />
          </div>
          <h2 className="mt-4 text-heading-3 text-ink">Publier un document</h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Déposez cours, TD, examens et fiches pour vos matières assignées.
          </p>
        </Link>

        <Link
          href="/prof/mes-cours"
          className="group rounded-lg border border-hairline bg-white p-6 shadow-level-1 transition hover:shadow-level-2"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-accent-purple/15 p-2 text-accent-purple-deep">
              <Library className="h-5 w-5" />
            </span>
            <ArrowRight className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-1" />
          </div>
          <h2 className="mt-4 text-heading-3 text-ink">Ma Bibliothèque</h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Accédez à votre coffre-fort, gérez le statut public/privé et les partages multi-classes.
          </p>
        </Link>

        <Link
          href="/prof/matieres"
          className="group rounded-lg border border-hairline bg-white p-6 shadow-level-1 transition hover:shadow-level-2"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-accent-teal/15 p-2 text-accent-teal">
              <BookMarked className="h-5 w-5" />
            </span>
            <ArrowRight className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-1" />
          </div>
          <h2 className="mt-4 text-heading-3 text-ink">Mes Matières</h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Consultez le détail des matières attribuées par l'administration avec vos volumes de cours.
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
