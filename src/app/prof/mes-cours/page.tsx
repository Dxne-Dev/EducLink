import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { RESOURCE_TYPE_LABELS } from '@/lib/constants'
import { formatFileSize, formatDate, cn } from '@/lib/utils'
import {
  FileText,
  Lock,
  Globe,
  Plus,
  Share2,
  BookOpen,
  GraduationCap,
  Sparkles,
  Library,
} from 'lucide-react'
import { ResourceActionsMenu } from '@/app/(dashboard)/dashboard/cours/resource-actions-menu'
import { VisibilityToggleButton } from './visibility-toggle-button'
import { MatiereFilterSelect } from './matiere-filter-select'
import { RealtimeResourcesWatcher } from '@/components/realtime/RealtimeResourcesWatcher'
import { PageHeader } from '@/components/layout/PageHeader'

export const metadata = { title: 'Edulink — Ma Bibliothèque (Enseignant)' }

const TYPE_STICKER: Record<string, string> = {
  cours: 'bg-accent-purple/20 text-accent-purple-deep dark:bg-purple-900/30 dark:text-purple-300',
  fiche: 'bg-accent-teal/15 text-accent-teal dark:bg-teal-900/30 dark:text-teal-300',
  tp: 'bg-accent-orange/15 text-accent-orange-deep dark:bg-amber-900/30 dark:text-amber-300',
  examen: 'bg-accent-pink/15 text-accent-pink dark:bg-rose-900/30 dark:text-rose-300',
  td: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
}

export default async function ProfMesCoursPage({
  searchParams,
}: {
  searchParams: Promise<{ matiere?: string; type?: string; visibility?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
    redirect('/etudiant/dashboard')
  }

  // Récupérer le registre si l'enseignant a été assigné avant l'activation
  const { data: registryEntry } = await supabase
    .from('teacher_registry')
    .select('id')
    .ilike('email', user.email || '')
    .maybeSingle()

  // Récupérer les matières assignées à l'enseignant (pour les filtres)
  let tmQuery = supabase
    .from('teacher_matieres')
    .select('matieres(id, name, code, niveaux(name, filieres(name, code)))')

  if (registryEntry?.id) {
    tmQuery = tmQuery.or(`teacher_id.eq.${user.id},teacher_registry_id.eq.${registryEntry.id}`)
  } else {
    tmQuery = tmQuery.eq('teacher_id', user.id)
  }

  const { data: tmRows } = await tmQuery

  const myMatieres = (tmRows ?? [])
    .map((r: any) => r.matieres)
    .filter(Boolean)
    .filter((m: any, idx: number, arr: any[]) => arr.findIndex((x: any) => x.id === m.id) === idx)

  // Trouver la matière filtrée (par code ou par id)
  const selectedMatiere = params.matiere
    ? myMatieres.find(
        (m: any) =>
          (m.code && m.code.toLowerCase() === params.matiere?.toLowerCase()) ||
          m.id === params.matiere
      )
    : null

  // Requête principale : TOUTES les ressources de l'enseignant
  let query = supabase
    .from('resources')
    .select(`
      *,
      matieres(
        id, name, code,
        niveaux(name, filieres(name, code))
      ),
      promotions(id, name, year_start, year_end),
      resource_promo_access(
        promo_id, visibility,
        promotions(id, name, year_start, year_end)
      )
    `)
    .eq('uploaded_by', user.id)
    .order('created_at', { ascending: false })

  if (selectedMatiere) {
    query = query.eq('matiere_id', selectedMatiere.id)
  } else if (params.matiere) {
    query = query.eq('matiere_id', params.matiere)
  }

  if (params.type) query = query.eq('type', params.type)
  if (params.visibility) query = query.eq('visibility', params.visibility)

  const { data: resources } = await query

  // Toutes les promotions pour le partage
  const { data: allPromos } = await supabase
    .from('promotions')
    .select('id, name, year_start, year_end')
    .order('year_start', { ascending: false })

  // Counts indépendants du filtre de visibilité
  const makeCountQuery = (visibility?: string) => {
    let q = supabase.from('resources').select('*', { count: 'exact', head: true }).eq('uploaded_by', user.id)
    if (selectedMatiere) { q = q.eq('matiere_id', selectedMatiere.id) }
    else if (params.matiere) { q = q.eq('matiere_id', params.matiere) }
    if (params.type) q = q.eq('type', params.type)
    if (visibility) q = q.eq('visibility', visibility)
    return q
  }
  const { count: totalCount } = await makeCountQuery()
  const { count: publicCount } = await makeCountQuery('public')
  const { count: privateCount } = await makeCountQuery('private')

  const matiereQueryParam = params.matiere ? `&matiere=${encodeURIComponent(params.matiere)}` : ''

  const breadcrumb = [
    { label: 'Espace Enseignant', href: '/prof/mes-cours' },
    { label: 'Ma Bibliothèque' },
  ]

  const headerAction = (
    <Link
      href="/prof/cours/upload"
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-body-sm font-semibold text-white shadow-xs transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
    >
      <Plus className="h-4 w-4" />
      <span>Publier un cours</span>
    </Link>
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <RealtimeResourcesWatcher />

      <PageHeader
        breadcrumb={breadcrumb}
        title="Ma Bibliothèque de Cours"
        subtitle="Gérez vos documents pédagogiques, configurez leur visibilité et partagez-les entre plusieurs promotions."
        actions={headerAction}
      />

      {/* Barre de stats et filtres */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2 text-caption">
          <Link
            href={params.matiere ? `/prof/mes-cours?matiere=${encodeURIComponent(params.matiere)}` : '/prof/mes-cours'}
            className={cn(
              'rounded-xl px-3.5 py-1.5 font-medium transition-colors',
              !params.visibility
                ? 'bg-primary text-white shadow-xs'
                : 'bg-canvas-soft text-ink-muted hover:text-ink dark:bg-slate-800 dark:text-slate-300'
            )}
          >
            Tous ({totalCount ?? 0})
          </Link>
          <Link
            href={
              params.matiere
                ? `/prof/mes-cours?visibility=public${matiereQueryParam}`
                : '/prof/mes-cours?visibility=public'
            }
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-medium transition-colors',
              params.visibility === 'public'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-canvas-soft text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300'
            )}
          >
            <Globe className="h-3.5 w-3.5" />
            Publics ({publicCount ?? 0})
          </Link>
          <Link
            href={
              params.matiere
                ? `/prof/mes-cours?visibility=private${matiereQueryParam}`
                : '/prof/mes-cours?visibility=private'
            }
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-medium transition-colors',
              params.visibility === 'private'
                ? 'bg-slate-800 text-white shadow-xs dark:bg-slate-700'
                : 'bg-canvas-soft text-ink-muted hover:text-ink dark:bg-slate-800 dark:text-slate-300'
            )}
          >
            <Lock className="h-3.5 w-3.5" />
            Privés / Brouillons ({privateCount ?? 0})
          </Link>
        </div>

        {/* Filtre interactif par matière via Client Component */}
        <MatiereFilterSelect
          matieres={myMatieres}
          selectedMatiereParam={params.matiere}
        />
      </div>

      {/* Indicateur de filtre actif */}
      {selectedMatiere && (
        <div className="flex items-center justify-between rounded-2xl bg-accent-purple/10 dark:bg-purple-950/30 px-4 py-2.5 text-caption text-accent-purple-deep dark:text-purple-300 border border-accent-purple/20">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>
              Filtré par la matière : <strong>{selectedMatiere.name}</strong> {selectedMatiere.code ? `(${selectedMatiere.code})` : ''}
            </span>
          </div>
          <Link
            href="/prof/mes-cours"
            className="font-semibold underline hover:text-ink dark:hover:text-white"
          >
            Réinitialiser le filtre
          </Link>
        </div>
      )}

      {/* Liste des ressources du professeur */}
      {!resources || resources.length === 0 ? (
        <Card className="rounded-3xl border border-hairline bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="py-12">
            <EmptyState
              icon={<Library className="h-8 w-8 text-ink-faint" />}
              title="Aucune ressource trouvée"
              description="Déposez vos supports de cours, TD, examens ou fiches pour vos matières et promotions assignées."
              action={
                <Link
                  href="/prof/cours/upload"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-body-sm font-semibold text-white shadow-xs hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Déposer mon premier document
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource: any) => {
            const extraPromos = resource.resource_promo_access ?? []
            const primaryPromo = resource.promotions
            const matiere = resource.matieres
            const niveau = matiere?.niveaux
            const filiere = niveau?.filieres

            return (
              <Card
                key={resource.id}
                className={cn(
                  'flex flex-col justify-between rounded-3xl border border-hairline bg-white shadow-xs transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900',
                  resource.visibility === 'private' && 'border-dashed opacity-90'
                )}
              >
                <CardContent className="p-5 space-y-3.5">
                  {/* En-tête de carte : Type & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        'rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider',
                        TYPE_STICKER[resource.type] ?? 'bg-canvas-soft text-ink dark:bg-slate-800 dark:text-slate-300'
                      )}
                    >
                      {RESOURCE_TYPE_LABELS[resource.type as keyof typeof RESOURCE_TYPE_LABELS] ?? resource.type}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <VisibilityToggleButton
                        resourceId={resource.id}
                        currentVisibility={resource.visibility}
                      />
                      <ResourceActionsMenu
                        resource={resource}
                        currentUserId={user.id}
                        isAdmin={profile?.role === 'admin'}
                        promotions={allPromos ?? []}
                        editBasePath="/prof/cours/edit"
                      />
                    </div>
                  </div>

                  {/* Titre & Description */}
                  <div>
                    <h3
                      className="font-bold text-ink dark:text-slate-100 text-body-md line-clamp-1"
                      title={resource.title}
                    >
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="mt-1 text-caption text-ink-muted dark:text-slate-400 line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                  </div>

                  {/* Filière & Matière */}
                  <div className="space-y-1 rounded-2xl bg-canvas-soft/80 dark:bg-slate-800/60 p-2.5 text-caption border border-hairline dark:border-slate-800">
                    <div className="flex items-center justify-between text-ink-muted dark:text-slate-400">
                      <span className="flex items-center gap-1.5 font-semibold text-ink dark:text-slate-200 truncate">
                        <BookOpen className="h-3.5 w-3.5 shrink-0 text-accent-purple-deep dark:text-purple-300" />
                        {matiere?.name ?? 'Matière non assignée'}
                      </span>
                      {matiere?.code && (
                        <span className="font-mono text-[10px] font-bold text-primary dark:text-sky-400">
                          {matiere.code}
                        </span>
                      )}
                    </div>
                    {filiere && (
                      <p className="text-[11px] text-ink-faint dark:text-slate-400 truncate">
                        {filiere.name} · {niveau?.name}
                      </p>
                    )}
                  </div>

                  {/* Promotions associées */}
                  <div className="space-y-1.5 border-t border-hairline dark:border-slate-800 pt-2.5 text-caption">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[11px] text-ink-muted dark:text-slate-400">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Promotions avec accès :
                      </span>
                      <Link
                        href={`/prof/mes-cours/${resource.id}/partage`}
                        className="text-[11px] font-semibold text-primary hover:underline dark:text-sky-400 flex items-center gap-1"
                      >
                        <Share2 className="h-3 w-3" />
                        Gérer ({1 + extraPromos.length})
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {primaryPromo && (
                        <span className="rounded-lg bg-canvas-soft dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-ink-secondary dark:text-slate-300">
                          {primaryPromo.name}
                        </span>
                      )}
                      {extraPromos.map((p: any) => (
                        <span
                          key={p.promo_id}
                          className="rounded-lg bg-accent-purple/10 dark:bg-purple-950/40 px-2 py-0.5 text-[10px] font-medium text-accent-purple-deep dark:text-purple-300"
                          title="Promotion partagée"
                        >
                          +{p.promotions?.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pied de carte : Taille, Date */}
                  <div className="flex items-center justify-between border-t border-hairline dark:border-slate-800 pt-2.5 text-caption text-ink-faint dark:text-slate-500 font-mono">
                    <span>{resource.file_size ? formatFileSize(resource.file_size) : 'Document'}</span>
                    <span>{formatDate(resource.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
