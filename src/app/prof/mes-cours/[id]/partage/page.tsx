import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Share2, Globe, Lock, FileText, BookOpen, GraduationCap, Building2 } from 'lucide-react'
import { RESOURCE_TYPE_LABELS } from '@/lib/constants'
import { RealtimeResourcesWatcher } from '@/components/realtime/RealtimeResourcesWatcher'
import { ShareForm } from './share-form'
import { RevokeButton } from './revoke-button'
import { PageHeader } from '@/components/layout/PageHeader'

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

  const breadcrumb = [
    { label: 'Espace Enseignant', href: '/prof/mes-cours' },
    { label: 'Ma Bibliothèque', href: '/prof/mes-cours' },
    { label: 'Gérer les partages' },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <RealtimeResourcesWatcher />

      <PageHeader
        breadcrumb={breadcrumb}
        title="Partage Inter-Promotions"
        subtitle="Autorisez d'autres cohortes d'étudiants à accéder à ce document pédagogique sans duplication de stockage."
      />

      {/* Résumé de la ressource (Hero Card) */}
      <Card className="rounded-3xl border border-hairline bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <span className="inline-flex rounded-lg bg-accent-purple/15 px-2.5 py-1 text-caption font-bold uppercase tracking-wider text-accent-purple-deep dark:bg-purple-900/30 dark:text-purple-300">
                {RESOURCE_TYPE_LABELS[resource.type as keyof typeof RESOURCE_TYPE_LABELS] ?? resource.type}
              </span>
              <h2 className="text-heading-3 text-ink dark:text-slate-100 font-bold">{resource.title}</h2>
              {resource.description && (
                <p className="text-body-sm text-ink-muted dark:text-slate-400">{resource.description}</p>
              )}
            </div>

            <Badge variant={resource.visibility === 'public' ? 'success' : 'secondary'} className="px-3 py-1">
              {resource.visibility === 'public' ? (
                <>
                  <Globe className="mr-1.5 h-3.5 w-3.5" /> Public
                </>
              ) : (
                <>
                  <Lock className="mr-1.5 h-3.5 w-3.5" /> Privé
                </>
              )}
            </Badge>
          </div>

          <div className="grid gap-3 rounded-2xl border border-hairline bg-canvas-soft/80 dark:bg-slate-800/50 p-4 sm:grid-cols-3 text-caption">
            <div className="flex items-start gap-2">
              <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-ink-faint dark:text-slate-400">Matière :</span>
                <p className="font-semibold text-ink dark:text-slate-100">{matiere?.name ?? '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <GraduationCap className="h-4 w-4 text-accent-teal shrink-0 mt-0.5" />
              <div>
                <span className="text-ink-faint dark:text-slate-400">Filière & Niveau :</span>
                <p className="font-semibold text-ink dark:text-slate-100">
                  {filiere?.name} · {niveau?.name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-accent-orange-deep shrink-0 mt-0.5" />
              <div>
                <span className="text-ink-faint dark:text-slate-400">Promotion d'origine :</span>
                <p className="font-semibold text-ink dark:text-slate-100">{resource.promotions?.name ?? '—'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partages actuels */}
      <Card className="rounded-3xl border border-hairline bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="pb-4">
          <CardTitle className="text-title text-ink dark:text-slate-100">
            Promotions & Cohortes ayant accès
          </CardTitle>
          <CardDescription className="text-caption text-ink-muted dark:text-slate-400">
            Ce document physique est partagé avec les promotions ci-dessous en lecture directe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-hairline dark:divide-slate-800">
            {/* Promotion d'origine */}
            <div className="flex items-center justify-between py-3.5">
              <div>
                <p className="font-semibold text-ink dark:text-slate-100 text-body-sm">
                  {resource.promotions?.name ?? 'Promotion principale'}
                </p>
                <p className="text-caption text-ink-muted dark:text-slate-400 mt-0.5">
                  Promotion d'origine · Visibilité globale : {resource.visibility === 'public' ? 'Public' : 'Privé'}
                </p>
              </div>
              <Badge variant="purple" className="px-2.5 py-1 font-semibold">Origine</Badge>
            </div>

            {/* Promotions supplémentaires */}
            {(existingShares ?? []).map((share: any) => {
              const promo = share.promotions
              const pNiveau = promo?.niveaux
              const pFiliere = pNiveau?.filieres

              return (
                <div key={share.id} className="flex items-center justify-between py-3.5">
                  <div>
                    <p className="font-semibold text-ink dark:text-slate-100 text-body-sm">{promo?.name}</p>
                    <p className="text-caption text-ink-muted dark:text-slate-400 mt-0.5">
                      {pFiliere?.name} · {pNiveau?.name}
                      {promo?.year_start && ` (${promo.year_start}–${promo.year_end})`}
                      {' · '}
                      <span className={share.visibility === 'public' ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
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
      <Card className="rounded-3xl border border-hairline bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary dark:bg-primary/25">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-title text-ink dark:text-slate-100">
                Partager avec une autre promotion
              </CardTitle>
              <CardDescription className="text-caption text-ink-muted dark:text-slate-400">
                Permet aux étudiants d'une autre classe de réviser avec ce cours. Zéro octet supplémentaire consommé.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {availablePromos.length === 0 ? (
            <p className="text-body-sm text-ink-muted dark:text-slate-400 py-2">
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
