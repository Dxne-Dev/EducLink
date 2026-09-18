import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
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
  Filter,
  ExternalLink,
} from 'lucide-react'
import { ResourceActionsMenu } from '@/app/(dashboard)/dashboard/cours/resource-actions-menu'
import { VisibilityToggleButton } from './visibility-toggle-button'

import { MatiereFilterSelect } from './matiere-filter-select'
import { RealtimeResourcesWatcher } from '@/components/realtime/RealtimeResourcesWatcher'

export const metadata = { title: 'Edulink — Ma Bibliothèque (Enseignant)' }

const TYPE_STICKER: Record<string, string> = {
  cours: 'bg-accent-purple/20 text-accent-purple-deep',
  fiche: 'bg-accent-teal/15 text-accent-teal',
  tp: 'bg-accent-orange/15 text-accent-orange-deep',
  examen: 'bg-accent-pink/15 text-accent-pink',
  td: 'bg-blue-100 text-blue-700',
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
    // Si c'est un UUID direct ou inconnu
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

  const totalCount = resources?.length ?? 0
  const publicCount = resources?.filter((r) => r.visibility === 'public').length ?? 0
  const privateCount = resources?.filter((r) => r.visibility === 'private').length ?? 0

  const matiereQueryParam = params.matiere ? `&matiere=${encodeURIComponent(params.matiere)}` : ''

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Écoute les changements en temps réel (Supabase Realtime) */}
      <RealtimeResourcesWatcher />
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-heading-2 text-ink">Ma Bibliothèque</h1>
            <span className="rounded-full bg-accent-purple/20 px-2.5 py-0.5 text-caption font-semibold text-accent-purple-deep">
              Coffre-fort Enseignant
            </span>
          </div>
          <p className="mt-1 text-body-sm text-ink-muted">
            Gérez vos fichiers, activez la visibilité pour vos examens et partagez vos cours entre plusieurs promotions sans doublon.
          </p>
        </div>

        <Link
          href="/prof/cours/upload"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-body-md font-medium text-white shadow-level-1 hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          Publier un document
        </Link>
      </div>

      {/* Barre de stats et filtres */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-caption">
          <Link
            href={params.matiere ? `/prof/mes-cours?matiere=${encodeURIComponent(params.matiere)}` : '/prof/mes-cours'}
            className={cn(
              'rounded-md px-3 py-1.5 font-medium transition-colors',
              !params.visibility
                ? 'bg-primary text-white'
                : 'bg-canvas-soft text-ink-muted hover:text-ink'
            )}
          >
            Tous ({totalCount})
          </Link>
          <Link
            href={
              params.matiere
                ? `/prof/mes-cours?visibility=public${matiereQueryParam}`
                : '/prof/mes-cours?visibility=public'
            }
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors',
              params.visibility === 'public'
                ? 'bg-emerald-600 text-white'
                : 'bg-canvas-soft text-emerald-700 hover:bg-emerald-50'
            )}
          >
            <Globe className="h-3 w-3" />
            Publics ({publicCount})
          </Link>
          <Link
            href={
              params.matiere
                ? `/prof/mes-cours?visibility=private${matiereQueryParam}`
                : '/prof/mes-cours?visibility=private'
            }
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors',
              params.visibility === 'private'
                ? 'bg-ink text-white'
                : 'bg-canvas-soft text-ink-muted hover:bg-canvas-soft hover:text-ink'
            )}
          >
            <Lock className="h-3 w-3" />
            Privés / Brouillons ({privateCount})
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
        <div className="flex items-center justify-between rounded-md bg-accent-purple/10 px-4 py-2 text-caption text-accent-purple-deep">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>
              Affichage des ressources filtrées pour : <strong>{selectedMatiere.name}</strong> {selectedMatiere.code ? `(${selectedMatiere.code})` : ''}
            </span>
          </div>
          <Link
            href="/prof/mes-cours"
            className="font-medium underline hover:text-ink"
          >
            Afficher toutes les matières
          </Link>
        </div>
      )}

      {/* Liste des ressources du professeur */}
      {!resources || resources.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <EmptyState
              title="Aucune ressource trouvée"
              description="Déposez vos supports de cours, TD, examens ou fiches pour vos matières assignées."
              action={
                <Link
                  href="/prof/cours/upload"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-body-sm font-medium text-white shadow-sm hover:bg-primary-hover"
                >
                  <Plus className="h-4 w-4" />
                  Déposer mon premier document
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  'flex flex-col justify-between transition-all hover:shadow-level-1',
                  resource.visibility === 'private' && 'border-dashed opacity-90'
                )}
              >
                <CardContent className="p-5 space-y-3">
                  {/* En-tête de carte : Type & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        'rounded-md px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider',
                        TYPE_STICKER[resource.type] ?? 'bg-canvas-soft text-ink'
                      )}
                    >
                      {RESOURCE_TYPE_LABELS[resource.type as keyof typeof RESOURCE_TYPE_LABELS] ?? resource.type}
                    </span>

                    <div className="flex items-center gap-2">
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
                      className="font-semibold text-ink text-title line-clamp-1"
                      title={resource.title}
                    >
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="mt-1 text-caption text-ink-muted line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                  </div>

                  {/* Filière & Matière */}
                  <div className="space-y-1 rounded-md bg-canvas-soft p-2 text-caption">
                    <div className="flex items-center justify-between text-ink-muted">
                      <span className="flex items-center gap-1 font-medium text-ink truncate">
                        <BookOpen className="h-3 w-3 shrink-0 text-accent-purple-deep" />
                        {matiere?.name ?? 'Matière non assignée'}
                      </span>
                      {matiere?.code && (
                        <span className="font-mono text-[10px] font-semibold text-ink-muted">
                          {matiere.code}
                        </span>
                      )}
                    </div>
                    {filiere && (
                      <p className="text-[11px] text-ink-faint truncate">
                        {filiere.name} · {niveau?.name}
                      </p>
                    )}
                  </div>

                  {/* Promotions associées */}
                  <div className="space-y-1 border-t border-hairline pt-2 text-caption">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[11px] text-ink-muted">
                        <GraduationCap className="h-3 w-3" />
                        Classes avec accès :
                      </span>
                      <Link
                        href={`/prof/mes-cours/${resource.id}/partage`}
                        className="text-[11px] font-medium text-primary hover:underline"
                      >
                        Gérer partages ({1 + extraPromos.length})
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {primaryPromo && (
                        <span className="rounded bg-canvas-soft px-1.5 py-0.5 text-[10px] font-medium text-ink-secondary">
                          {primaryPromo.name}
                        </span>
                      )}
                      {extraPromos.map((p: any) => (
                        <span
                          key={p.promo_id}
                          className="rounded bg-accent-purple/10 px-1.5 py-0.5 text-[10px] font-medium text-accent-purple-deep"
                          title="Promotion partagée"
                        >
                          +{p.promotions?.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pied de carte : Taille, Date & Raccourci Partage */}
                  <div className="flex items-center justify-between border-t border-hairline pt-3 text-caption text-ink-faint">
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
