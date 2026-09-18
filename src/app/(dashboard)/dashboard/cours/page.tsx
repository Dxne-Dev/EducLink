import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { RESOURCE_TYPE_LABELS, STATUS_LABELS, VISIBILITY_LABELS } from '@/lib/constants'
import { formatFileSize, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { FileText, Lock, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

import { ResourceActionsMenu } from './resource-actions-menu'
import { RealtimeResourcesWatcher } from '@/components/realtime/RealtimeResourcesWatcher'

export const metadata = { title: 'Edulink - Cours & Ressources' }

const TYPE_STICKER: Record<string, string> = {
  cours: 'bg-accent-purple/20 text-accent-purple-deep',
  fiche: 'bg-accent-teal/15 text-accent-teal',
  tp: 'bg-accent-orange/15 text-accent-orange-deep',
  examen: 'bg-accent-pink/15 text-accent-pink',
}

export default async function CoursPage({
  searchParams,
}: {
  searchParams: { matiere?: string; promo?: string; type?: string; uploader?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get student profile for filiere and niveau
  const { data: profile } = await supabase
    .from('profiles')
    .select('filiere_id, niveau_id, role')
    .eq('id', user.id)
    .single()

  const isStudent = profile?.role === 'student'
  const isTeacherOrAdmin = profile?.role === 'teacher' || profile?.role === 'admin'
  const currentUserId = user?.id
  const isAdmin = profile?.role === 'admin'
  const studentFiliereId = profile?.filiere_id
  const studentNiveauId = profile?.niveau_id

  // Get filieres and promotions for filter dropdowns
  const [filieresRes, promotionsRes] = await Promise.all([
    supabase.from('filieres').select('id, name, code'),
    supabase.from('promotions').select('id, name, year_start, year_end'),
  ])

  const filieres = filieresRes.data ?? []
  const promotions = promotionsRes.data ?? []

  let query = supabase
    .from('resources')
    .select(`
      *,
      matieres(name, code, niveaux(name, filieres(name, code))),
      promotions(name),
      profiles(full_name)
    `)
    .order('created_at', { ascending: false })

  // For students, automatically filter by their filiere and niveau
  if (isStudent && studentFiliereId && studentNiveauId) {
    query = query
      .eq('matieres.niveaux.filiere_id', studentFiliereId)
      .eq('matieres.niveaux.id', studentNiveauId)
  }

  // Apply additional filters from searchParams
  if (searchParams.matiere) query = query.eq('matiere_id', searchParams.matiere)
  if (searchParams.promo) query = query.eq('promo_id', searchParams.promo)
  if (searchParams.type) query = query.eq('type', searchParams.type)
  if (searchParams.uploader) query = query.eq('uploaded_by', searchParams.uploader)

  // Students should only see public resources unless they're the owner or viewing specific uploader
  if (isStudent && !searchParams.uploader) {
    query = query
      .or(`visibility.eq.public,uploaded_by.eq.${currentUserId}`)
  }

  const { data: resources } = await query

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Écoute les changements en temps réel (Supabase Realtime) */}
      <RealtimeResourcesWatcher />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-2 text-ink">Cours & Ressources</h1>
          <p className="mt-1 text-body-sm text-ink-muted">
            {resources?.length ?? 0} ressource(s) disponible(s)
          </p>
        </div>
        {isTeacherOrAdmin && (
          <Link href="/dashboard/cours/upload">
            <Button>Ajouter une ressource</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-title">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <Filters filieres={filieres} promotions={promotions} />
        </CardContent>
      </Card>

      {resources && resources.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              promotions={promotions}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              title="Aucune ressource trouvée"
              description="Ajustez vos filtres ou revenez plus tard."
              action={
                isTeacherOrAdmin ? (
                  <Link href="/dashboard/cours/upload">
                    <Button variant="primary" size="sm">Ajouter une ressource</Button>
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

async function Filters({
  filieres,
  promotions,
}: {
  filieres: { id: string; name: string; code: string }[]
  promotions: { id: string; name: string }[]
}) {
  return (
    <form method="get" className="flex flex-wrap gap-3">
      <Select name="matiere" className="w-48" defaultValue="">
        <option value="">Toutes les matières</option>
        {filieres.map((f) => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </Select>
      <Select name="promo" className="w-48" defaultValue="">
        <option value="">Toutes les promotions</option>
        {promotions.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </Select>
      <Select name="type" className="w-40" defaultValue="">
        <option value="">Tous les types</option>
        {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </Select>
      <Button type="submit" variant="secondary">Filtrer</Button>
    </form>
  )
}

function ResourceCard({
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
  const isPrivate = resource.visibility === 'private'

  return (
    <Card className="transition-shadow hover:shadow-level-1">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="default">{RESOURCE_TYPE_LABELS[resource.type as keyof typeof RESOURCE_TYPE_LABELS]}</Badge>
          <div className="flex items-center gap-1.5">
            {isPrivate ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-canvas-soft px-2 py-0.5 text-eyebrow text-ink-muted">
                <Lock className="h-3 w-3" /> Privé
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-eyebrow text-emerald-700">
                <Globe className="h-3 w-3" /> Public
              </span>
            )}
            <ResourceActionsMenu
              resource={resource}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              promotions={promotions}
            />
          </div>
        </div>
        <h3 className="mt-3 text-title font-semibold text-ink">{resource.title}</h3>
        {resource.description && (
          <p className="mt-1 line-clamp-2 text-body-sm text-ink-muted">{resource.description}</p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', sticker)}>
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0 space-y-0.5 text-caption text-ink-muted">
            <p className="truncate">{filiere?.name} · {niveau?.name} · {matiere?.name}</p>
            <p className="truncate">{resource.promotions?.name} · {resource.profiles?.full_name || 'Enseignant'}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-caption text-ink-muted">
          <span>{resource.file_size ? formatFileSize(resource.file_size) : '—'}</span>
          <span>{formatDate(resource.created_at)}</span>
        </div>
      </CardContent>
    </Card>
  )
}