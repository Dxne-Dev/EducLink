import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { RESOURCE_TYPE_LABELS, STATUS_LABELS } from '@/lib/constants'
import { formatFileSize, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  searchParams: { matiere?: string; promo?: string; type?: string }
}) {
  const supabase = await createClient()

  const [filieres, promotions] = await Promise.all([
    supabase.from('filieres').select('id, name, code'),
    supabase.from('promotions').select('id, name, year_start, year_end'),
  ])

  let query = supabase
    .from('resources')
    .select(`
      *,
      matieres(name, code, niveaux(name, filieres(name, code))),
      promotions(name),
      profiles(full_name)
    `)
    .eq('status', 'validated')
    .order('created_at', { ascending: false })

  if (searchParams.matiere) query = query.eq('matiere_id', searchParams.matiere)
  if (searchParams.promo) query = query.eq('promo_id', searchParams.promo)
  if (searchParams.type) query = query.eq('type', searchParams.type)

  const { data: resources } = await query

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-2 text-ink">Cours & Ressources</h1>
          <p className="mt-1 text-body-sm text-ink-muted">
            {resources?.length ?? 0} ressources validées disponibles
          </p>
        </div>
        <Link href="/dashboard/cours/upload">
          <Button>Ajouter une ressource</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-title">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <Filters filieres={filieres.data ?? []} promotions={promotions.data ?? []} />
        </CardContent>
      </Card>

      {resources && resources.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              title="Aucune ressource trouvée"
              description="Ajustez vos filtres ou ajoutez une nouvelle ressource."
              action={
                <Link href="/dashboard/cours/upload">
                  <Button variant="primary" size="sm">Ajouter une ressource</Button>
                </Link>
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

function ResourceCard({ resource }: { resource: any }) {
  const matiere = resource.matieres
  const niveau = matiere?.niveaux
  const filiere = niveau?.filieres
  const sticker = TYPE_STICKER[resource.type as string] ?? 'bg-canvas-soft text-ink-muted'

  return (
    <Card className="transition-shadow hover:shadow-level-1">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="default">{RESOURCE_TYPE_LABELS[resource.type as keyof typeof RESOURCE_TYPE_LABELS]}</Badge>
          {resource.status === 'validated' && (
            <Badge variant="success">{STATUS_LABELS[resource.status as keyof typeof STATUS_LABELS]}</Badge>
          )}
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
            <p className="truncate">{resource.promotions?.name}</p>
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