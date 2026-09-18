import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Share2, Trash2, Globe, Lock, FileText } from 'lucide-react'
import { RESOURCE_TYPE_LABELS } from '@/lib/constants'
import { RealtimeResourcesWatcher } from '@/components/realtime/RealtimeResourcesWatcher'
import { ShareForm } from './share-form'
import { RevokeButton } from './revoke-button'

export const metadata = { title: 'Edulink — Partager une ressource' }

export default async function PartageResourcePage({
  params,
}: {
  params: { id: string }
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

  // Charger la ressource
  const { data: resource, error } = await supabase
    .from('resources')
    .select(`
      id, title, type, visibility, uploaded_by,
      matieres(name, code, niveaux(name, filieres(name))),
      promotions(id, name, year_start, year_end),
      resource_promo_access(
        promo_id, visibility,
        promotions(id, name, year_start, year_end)
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !resource) notFound()

  // Vérifier ownership (sauf admin)
  if (profile?.role === 'teacher' && resource.uploaded_by !== user.id) {
    redirect('/dashboard/mes-cours')
  }

  // Toutes les promotions disponibles pour le partage
  const { data: allPromos } = await supabase
    .from('promotions')
    .select('id, name, year_start, year_end, filiere_id, filieres(name, code)')
    .order('year_start', { ascending: false })

  // Promos déjà partagées
  const sharedPromos: any[] = (resource as any).resource_promo_access ?? []
  const sharedPromoIds = new Set(sharedPromos.map((sp: any) => sp.promo_id))

  // Promos disponibles (pas encore partagées)
  const availablePromos = (allPromos ?? []).filter(
    (p) => !sharedPromoIds.has(p.id) && p.id !== (resource as any).promotions?.id
  )

  const matiere = (resource as any).matieres
  const niveau = matiere?.niveaux
  const filiere = niveau?.filieres

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <RealtimeResourcesWatcher />
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/mes-cours"
          className="flex items-center gap-1.5 rounded-md border border-hairline bg-white px-3 py-1.5 text-body-sm text-ink-muted transition-colors hover:bg-canvas-soft hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour
        </Link>
        <div>
          <h1 className="text-heading-2 text-ink">Partager la ressource</h1>
          <p className="mt-0.5 text-body-sm text-ink-muted">
            Gérez les promotions ayant accès à ce document.
          </p>
        </div>
      </div>

      {/* Info ressource */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-purple/15 text-accent-purple-deep">
              <FileText className="h-5 w-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink text-body-md truncate">{resource.title}</p>
              <p className="text-caption text-ink-muted mt-0.5">
                {filiere?.name} · {niveau?.name} · {matiere?.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="default">
                  {RESOURCE_TYPE_LABELS[resource.type as keyof typeof RESOURCE_TYPE_LABELS] ?? resource.type}
                </Badge>
                {resource.visibility === 'public' ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-caption text-emerald-700">
                    <Globe className="h-3 w-3" /> Public
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-canvas-soft px-2 py-0.5 text-caption text-ink-muted">
                    <Lock className="h-3 w-3" /> Privé
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promotions déjà associées */}
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-3 flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            Accès actuels
          </CardTitle>
          <CardDescription>
            {sharedPromos.length === 0
              ? 'Aucune promotion supplémentaire n\'a accès à ce document.'
              : `${sharedPromos.length} promotion(s) ont accès à ce document.`}
          </CardDescription>
        </CardHeader>
        {sharedPromos.length > 0 && (
          <CardContent>
            <div className="divide-y divide-hairline">
              {sharedPromos.map((sp: any) => (
                <div key={sp.promo_id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-ink text-body-sm">{sp.promotions?.name}</p>
                    <p className="text-caption text-ink-muted">
                      {sp.promotions?.year_start}–{sp.promotions?.year_end}
                      {' · '}
                      <span className={sp.visibility === 'public' ? 'text-emerald-600' : 'text-ink-muted'}>
                        {sp.visibility === 'public' ? 'Visible par les étudiants' : 'Accès réservé'}
                      </span>
                    </p>
                  </div>
                  <RevokeButton resourceId={resource.id} promoId={sp.promo_id} />
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Formulaire de partage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-3">Ajouter un accès</CardTitle>
          <CardDescription>
            Partagez ce document avec une promotion supplémentaire sans dupliquer le fichier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availablePromos.length === 0 ? (
            <p className="text-body-sm text-ink-muted py-4 text-center">
              Toutes les promotions ont déjà accès à ce document.
            </p>
          ) : (
            <ShareForm resourceId={resource.id} availablePromos={availablePromos} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
