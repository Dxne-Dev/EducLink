import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
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
import { ResourceActionsMenu } from '../cours/resource-actions-menu'
import { VisibilityToggleButton } from './visibility-toggle-button'
import { RealtimeResourcesWatcher } from '@/components/realtime/RealtimeResourcesWatcher'

export const metadata = { title: 'Edulink — Ma Bibliothèque' }

const TYPE_STICKER: Record<string, string> = {
  cours: 'bg-accent-purple/20 text-accent-purple-deep',
  fiche: 'bg-accent-teal/15 text-accent-teal',
  tp: 'bg-accent-orange/15 text-accent-orange-deep',
  examen: 'bg-accent-pink/15 text-accent-pink',
  td: 'bg-blue-100 text-blue-700',
}

export default async function MesCoursPage({
  searchParams,
}: {
  searchParams: { matiere?: string; type?: string; visibility?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Récupérer les matières assignées à l'enseignant (pour les filtres)
  const { data: tmRows } = await supabase
    .from('teacher_matieres')
    .select('matieres(id, name, code, niveaux(name, filieres(name, code)))')
    .eq('teacher_id', user.id)

  const myMatieres = (tmRows ?? [])
    .map((r: any) => r.matieres)
    .filter(Boolean)
    .filter((m: any, idx: number, arr: any[]) => arr.findIndex((x: any) => x.id === m.id) === idx)

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

  if (searchParams.matiere) query = query.eq('matiere_id', searchParams.matiere)
  if (searchParams.type) query = query.eq('type', searchParams.type)
  if (searchParams.visibility) query = query.eq('visibility', searchParams.visibility)

  const { data: resources } = await query

  // Toutes les promotions pour le partage
  const { data: allPromos } = await supabase
    .from('promotions')
    .select('id, name, year_start, year_end')
    .order('year_start', { ascending: false })

  const totalCount = resources?.length ?? 0
  const publicCount = resources?.filter(r => r.visibility === 'public').length ?? 0
  const privateCount = resources?.filter(r => r.visibility === 'private').length ?? 0

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <RealtimeResourcesWatcher />
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-heading-2 text-ink">Ma Bibliothèque</h1>
          <p className="mt-1 text-body-sm text-ink-muted">
            Votre coffre-fort personnel — gérez, partagez et publiez vos documents.
          </p>
        </div>
        <Link href="/dashboard/cours/upload">
          <Button>
            <Plus className="h-4 w-4" />
            Nouveau document
          </Button>
        </Link>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-hairline bg-white p-4 text-center shadow-sm">
          <p className="text-heading-2 text-ink">{totalCount}</p>
          <p className="mt-0.5 text-caption text-ink-muted">Total</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center shadow-sm">
          <p className="text-heading-2 text-emerald-700">{publicCount}</p>
          <p className="mt-0.5 text-caption text-emerald-600">Publics</p>
        </div>
        <div className="rounded-lg border border-hairline bg-canvas-soft p-4 text-center shadow-sm">
          <p className="text-heading-2 text-ink-muted">{privateCount}</p>
          <p className="mt-0.5 text-caption text-ink-muted">Privés</p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="py-4">
          <form method="get" className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 shrink-0 text-ink-muted" />
            <Select name="matiere" defaultValue={searchParams.matiere ?? ''} className="w-52">
              <option value="">Toutes mes matières</option>
              {myMatieres.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.niveaux?.filieres?.code} · {m.niveaux?.name} · {m.name}
                </option>
              ))}
            </Select>
            <Select name="type" defaultValue={searchParams.type ?? ''} className="w-44">
              <option value="">Tous les types</option>
              {Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
            <Select name="visibility" defaultValue={searchParams.visibility ?? ''} className="w-44">
              <option value="">Toutes les visibilités</option>
              <option value="public">Publiques</option>
              <option value="private">Privées</option>
            </Select>
            <Button type="submit" variant="secondary" size="sm">Filtrer</Button>
            {(searchParams.matiere || searchParams.type || searchParams.visibility) && (
              <Link href="/dashboard/mes-cours" className="text-caption text-ink-muted hover:text-ink">
                Réinitialiser
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Liste des ressources */}
      {resources && resources.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <TeacherResourceCard
              key={r.id}
              resource={r}
              currentUserId={user.id}
              isAdmin={profile?.role === 'admin'}
              promotions={allPromos ?? []}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              title="Votre bibliothèque est vide"
              description={
                searchParams.matiere || searchParams.type || searchParams.visibility
                  ? 'Aucune ressource ne correspond à vos filtres.'
                  : 'Déposez votre premier cours, TD ou examen pour commencer.'
              }
              action={
                !searchParams.matiere && !searchParams.type && !searchParams.visibility ? (
                  <Link href="/dashboard/cours/upload">
                    <Button variant="primary" size="sm">
                      <Plus className="h-4 w-4" />
                      Ajouter un document
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TeacherResourceCard({
  resource,
  currentUserId,
  isAdmin,
  promotions,
}: {
  resource: any
  currentUserId?: string
  isAdmin?: boolean
  promotions: { id: string; name: string }[]
}) {
  const matiere = resource.matieres
  const niveau = matiere?.niveaux
  const filiere = niveau?.filieres
  const sticker = TYPE_STICKER[resource.type as string] ?? 'bg-canvas-soft text-ink-muted'
  const isPublic = resource.visibility === 'public'
  const sharedPromos: any[] = resource.resource_promo_access ?? []

  return (
    <Card className="group flex flex-col transition-shadow hover:shadow-level-1">
      <CardContent className="flex flex-1 flex-col p-5">
        {/* En-tête : type + visibilité + actions */}
        <div className="flex items-start justify-between gap-2">
          <Badge variant="default">
            {RESOURCE_TYPE_LABELS[resource.type as keyof typeof RESOURCE_TYPE_LABELS] ?? resource.type}
          </Badge>
          <div className="flex items-center gap-1.5">
            {/* Toggle visibilité rapide */}
            <VisibilityToggleButton
              resourceId={resource.id}
              currentVisibility={resource.visibility}
            />
            <ResourceActionsMenu
              resource={resource}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              promotions={promotions}
            />
          </div>
        </div>

        {/* Titre */}
        <h3 className="mt-3 text-title font-semibold text-ink">{resource.title}</h3>
        {resource.description && (
          <p className="mt-1 line-clamp-2 text-body-sm text-ink-muted">{resource.description}</p>
        )}

        {/* Cursus */}
        <div className="mt-3 flex items-center gap-2">
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', sticker)}>
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0 space-y-0.5 text-caption text-ink-muted">
            <p className="truncate">
              {filiere?.code ?? filiere?.name ?? '—'} · {niveau?.name ?? '—'} · {matiere?.name ?? '—'}
            </p>
            <p className="truncate">
              {resource.promotions?.name ? `Promo : ${resource.promotions.name}` : 'Sans promotion principale'}
            </p>
          </div>
        </div>

        {/* Partages multi-promos */}
        {sharedPromos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {sharedPromos.map((sp: any) => (
              <span
                key={sp.promo_id}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-caption text-primary"
              >
                <Share2 className="h-2.5 w-2.5" />
                {sp.promotions?.name}
              </span>
            ))}
          </div>
        )}

        {/* Lien vers la gestion détaillée des partages */}
        <Link
          href={`/dashboard/mes-cours/${resource.id}/partage`}
          className="mt-3 inline-flex items-center gap-1.5 text-caption font-medium text-primary hover:underline"
        >
          <Share2 className="h-3 w-3" />
          Gérer les partages
          <ExternalLink className="h-3 w-3" />
        </Link>

        {/* Pied de carte */}
        <div className="mt-auto flex items-center justify-between border-t border-hairline pt-3 text-caption text-ink-muted">
          <span>{resource.file_size ? formatFileSize(resource.file_size) : '—'}</span>
          <span>{formatDate(resource.created_at)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
