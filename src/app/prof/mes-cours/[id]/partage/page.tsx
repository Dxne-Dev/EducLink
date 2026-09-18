import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Share2, Globe, Lock, FileText } from 'lucide-react'
import { RESOURCE_TYPE_LABELS } from '@/lib/constants'
import { RealtimeResourcesWatcher } from '@/components/realtime/RealtimeResourcesWatcher'
import { ShareForm } from './share-form'
import { RevokeButton } from './revoke-button'

export const metadata = { title: 'Edulink — Gérer les partages' }

export default async function ProfPartagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Récupérer la ressource et vérifier la propriété
  const { data: resource } = await supabase
    .from('resources')
    .select(`
      *,
      matieres(id, name, code, niveaux(name, filieres(name, code))),
      promotions(id, name, year_start, year_end)
    `)
    .eq('id', id)
    .single()

  if (!resource) notFound()

  // Seul l'uploader ou un admin peut gérer les partages
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (resource.uploaded_by !== user.id && profile?.role !== 'admin') {
    redirect('/prof/mes-cours')
  }

  // Récupérer les partages existants
  const { data: existingShares } = await supabase
    .from('resource_promo_access')
    .select(`
      id,
      promo_id,
      visibility,
      granted_at,
      promotions(
        id, name, year_start, year_end,
        niveaux(name, filieres(name, code))
      )
    `)
    .eq('resource_id', id)

  // Récupérer toutes les promotions disponibles pour en ajouter
  const { data: allPromos } = await supabase
    .from('promotions')
    .select(`
      id, name, year_start, year_end,
      niveaux(name, filieres(name, code))
    `)
    .order('year_start', { ascending: false })

  const sharedPromoIds = new Set((existingShares ?? []).map((s) => s.promo_id))
  // Exclure la promo primaire et celles déjà partagées
  const availablePromos = (allPromos ?? []).filter(
    (p) => p.id !== resource.promo_id && !sharedPromoIds.has(p.id)
  )

  const matiere = resource.matieres
  const niveau = matiere?.niveaux
  const filiere = niveau?.filieres

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <RealtimeResourcesWatcher />
      {/* Retour */}
      <div>
        <Link
          href="/prof/mes-cours"
          className="inline-flex items-center gap-1.5 text-body-sm text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à ma bibliothèque
        </Link>
      </div>

      {/* Résumé de la ressource */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="rounded bg-accent-purple/15 px-2 py-0.5 text-caption font-bold uppercase tracking-wider text-accent-purple-deep">
                {RESOURCE_TYPE_LABELS[resource.type as keyof typeof RESOURCE_TYPE_LABELS] ?? resource.type}
              </span>
              <h1 className="text-heading-2 text-ink mt-1">{resource.title}</h1>
              {resource.description && (
                <p className="text-body-sm text-ink-muted">{resource.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={resource.visibility === 'public' ? 'success' : 'secondary'}>
                {resource.visibility === 'public' ? (
                  <>
                    <Globe className="mr-1 h-3 w-3" /> Public
                  </>
                ) : (
                  <>
                    <Lock className="mr-1 h-3 w-3" /> Privé
                  </>
                )}
              </Badge>
            </div>
          </div>

          <div className="mt-4 grid gap-3 rounded-lg border border-hairline bg-canvas-soft p-3 sm:grid-cols-3 text-caption">
            <div>
              <span className="text-ink-faint">Matière :</span>
              <p className="font-semibold text-ink">{matiere?.name ?? '—'}</p>
            </div>
            <div>
              <span className="text-ink-faint">Filière & Niveau :</span>
              <p className="font-semibold text-ink">
                {filiere?.name} · {niveau?.name}
              </p>
            </div>
            <div>
              <span className="text-ink-faint">Promotion d'origine :</span>
              <p className="font-semibold text-ink">{resource.promotions?.name ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partages actuels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-title">Classes & Promotions ayant accès</CardTitle>
          <CardDescription>
            Ce document physique est partagé avec les promotions ci-dessous sans duplication de stockage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-hairline">
            {/* Promotion d'origine */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-ink text-body-sm">
                  {resource.promotions?.name ?? 'Promotion principale'}
                </p>
                <p className="text-caption text-ink-muted">
                  Promotion d'origine · Visibilité globale du document : {resource.visibility}
                </p>
              </div>
              <Badge variant="purple">Origine</Badge>
            </div>

            {/* Promotions supplémentaires */}
            {(existingShares ?? []).map((share: any) => {
              const promo = share.promotions
              const pNiveau = promo?.niveaux
              const pFiliere = pNiveau?.filieres

              return (
                <div key={share.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-ink text-body-sm">{promo?.name}</p>
                    <p className="text-caption text-ink-muted">
                      {pFiliere?.name} · {pNiveau?.name}
                      {promo?.year_start && ` (${promo.year_start}–${promo.year_end})`}
                      {' · '}
                      <span className={share.visibility === 'public' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                        {share.visibility === 'public' ? 'Public' : 'Privé'}
                      </span>
                    </p>
                  </div>
                  <RevokeButton resourceId={resource.id} promoId={share.promo_id} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Formulaire d'ajout de partage */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-title">Partager avec une autre promotion</CardTitle>
              <CardDescription>
                Permet aux étudiants d'une autre classe de réviser avec ce cours. Zéro octet supplémentaire consommé.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {availablePromos.length === 0 ? (
            <p className="text-body-sm text-ink-muted py-2">
              Toutes les promotions existantes ont déjà accès à cette ressource.
            </p>
          ) : (
            <ShareForm resourceId={resource.id} availablePromos={availablePromos} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
