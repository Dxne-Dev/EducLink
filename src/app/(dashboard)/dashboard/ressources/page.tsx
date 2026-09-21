import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  BookOpen,
  FileText,
  GraduationCap,
  Clock,
  Users,
  Download,
  ExternalLink,
  X,
  Filter,
} from 'lucide-react'
import Link from 'next/link'
import type { ResourceType } from '@/types/database'
import { formatFileSize } from '@/lib/utils'
import { RealtimeResourcesWatcher } from '@/components/realtime/RealtimeResourcesWatcher'
import { ResourceViewLogger } from '@/components/resource/ResourceViewLogger'

export const metadata = { title: 'Edulink - Mes Ressources' }

interface MesRessourcesPageProps {
  searchParams?: Promise<{ uploader?: string; matiere?: string }>
}

export default async function MesRessourcesPage({ searchParams }: MesRessourcesPageProps) {
  const params = await searchParams
  const uploaderFilter = params?.uploader
  const matiereFilter = params?.matiere

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // 1. Récupérer le profil étudiant, sa filière, son niveau et sa promotion
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      filiere_id,
      niveau_id,
      promo_id,
      filieres(name, code),
      promotions(name, niveau_id, niveaux(name)),
      niveaux(name)
    `)
    .eq('id', user.id)
    .maybeSingle()

  const rawFiliere = profile?.filieres as unknown
  const filiereInfo = (Array.isArray(rawFiliere) ? rawFiliere[0] : rawFiliere) as { name: string; code: string } | null
  const studentFiliereId = profile?.filiere_id

  // Niveau dynamique lié à la promotion ou direct
  const rawPromo = profile?.promotions as any
  const promoData = Array.isArray(rawPromo) ? rawPromo[0] : rawPromo
  const studentNiveauId = promoData?.niveau_id || profile?.niveau_id
  const niveauName = promoData?.niveaux?.name || (profile?.niveaux as any)?.name

  let resources: any[] = []
  let activeTeacherName: string | null = null

  if (studentFiliereId && studentNiveauId) {
    // 2. Récupérer les ressources du niveau ET celles partagées avec la promotion
    let queryNiveau = supabase
      .from('resources')
      .select(`
        id,
        title,
        description,
        type,
        file_path,
        file_size,
        mime_type,
        version,
        created_at,
        uploaded_by,
        matiere_id,
        matieres!inner (
          id,
          name,
          niveau_id
        ),
        profiles!resources_uploaded_by_fkey (id, full_name, avatar_url)
      `)
      .eq('matieres.niveau_id', studentNiveauId)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })

    if (uploaderFilter) {
      queryNiveau = queryNiveau.eq('uploaded_by', uploaderFilter)
    }
    if (matiereFilter) {
      queryNiveau = queryNiveau.eq('matiere_id', matiereFilter)
    }

    // Récupérer aussi les IDs des ressources partagées avec sa promo
    let sharedResourceIds: string[] = []
    if (profile?.promo_id) {
      const { data: sharedAccess } = await supabase
        .from('resource_promo_access')
        .select('resource_id')
        .eq('promo_id', profile.promo_id)
        .eq('visibility', 'public')

      sharedResourceIds = (sharedAccess ?? []).map((s) => s.resource_id)
    }

    let sharedResources: any[] = []
    if (sharedResourceIds.length > 0) {
      let queryShared = supabase
        .from('resources')
        .select(`
          id,
          title,
          description,
          type,
          file_path,
          file_size,
          mime_type,
          version,
          created_at,
          uploaded_by,
          matiere_id,
          matieres (
            id,
            name,
            niveau_id
          ),
          profiles!resources_uploaded_by_fkey (id, full_name, avatar_url)
        `)
        .in('id', sharedResourceIds)

      if (uploaderFilter) {
        queryShared = queryShared.eq('uploaded_by', uploaderFilter)
      }
      if (matiereFilter) {
        queryShared = queryShared.eq('matiere_id', matiereFilter)
      }

      const { data: sharedData } = await queryShared
      sharedResources = sharedData ?? []
    }

    const { data: fetchedNiveauResources } = await queryNiveau

    // Fusionner et dédupliquer par id
    const resMap = new Map<string, any>()
    for (const r of fetchedNiveauResources ?? []) {
      resMap.set(r.id, r)
    }
    for (const r of sharedResources) {
      if (!resMap.has(r.id)) {
        resMap.set(r.id, r)
      }
    }
    const fetchedResources = Array.from(resMap.values())

    // 3. Génération des signed URLs sécurisées pour chaque fichier
    if (fetchedResources && fetchedResources.length > 0) {
      const resourcesWithUrls = await Promise.all(
        fetchedResources.map(async (r) => {
          let signedUrl: string | null = null
          if (r.file_path) {
            const { data: signedData } = await supabase.storage
              .from('resources')
              .createSignedUrl(r.file_path, 3600) // Valide 1 heure
            signedUrl = signedData?.signedUrl || null
          }
          return {
            ...r,
            signedUrl,
          }
        })
      )
      resources = resourcesWithUrls

      if (uploaderFilter) {
        const found = resources.find((r) => r.uploaded_by === uploaderFilter)
        activeTeacherName = found?.profiles?.full_name || 'Enseignant sélectionné'
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Écoute les changements en temps réel (Supabase Realtime) */}
      <RealtimeResourcesWatcher />
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-heading-2 text-ink">Mes Ressources</h1>
            {filiereInfo && (
              <Badge variant="purple" className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {filiereInfo.code || filiereInfo.name}
              </Badge>
            )}
            {niveauName && (
              <Badge variant="secondary" className="font-semibold text-primary">
                {niveauName}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-body-sm text-ink-muted">
            {filiereInfo && niveauName
              ? `Bibliothèque numérique de votre niveau (${filiereInfo.name} · ${niveauName}).`
              : 'Accédez à l\'ensemble des supports de cours, TD et examens.'}
          </p>
        </div>
      </div>

      {/* Barre de filtres actifs */}
      {uploaderFilter && (
        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-body-sm">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-ink">
              Ressources filtrées pour l'enseignant : <strong>{activeTeacherName}</strong>
            </span>
          </div>
          <Link
            href="/dashboard/ressources"
            className="flex items-center gap-1 text-caption font-medium text-primary hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            Effacer le filtre
          </Link>
        </div>
      )}

      {/* Liste des ressources */}
      {!studentFiliereId || !studentNiveauId ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              title="Cursus non renseigné"
              description="Veuillez compléter votre filière et niveau dans votre profil pour accéder aux ressources."
            />
          </CardContent>
        </Card>
      ) : resources.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              title={uploaderFilter ? "Aucun document publié par cet enseignant" : "Aucune ressource disponible"}
              description={
                uploaderFilter
                  ? "Cet enseignant n'a pas encore mis en ligne de support public pour votre niveau."
                  : "Aucune ressource publique n'a encore été publiée pour votre niveau cette année."
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="transition-all hover:shadow-level-1 flex flex-col justify-between">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-content-center rounded-lg bg-primary/10 text-primary font-amatry">
                    {getResourceTypeIcon(resource.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                        {resource.type}
                      </span>
                    </div>
                    <h3 className="font-semibold text-ink text-title truncate mt-0.5" title={resource.title}>
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="text-caption text-ink-muted line-clamp-2 mt-1">{resource.description}</p>
                    )}
                    <p className="text-caption text-ink-secondary flex items-center gap-1 mt-2">
                      <Users className="h-3 w-3 shrink-0" />
                      {resource.profiles?.full_name || 'Enseignant'}
                    </p>
                  </div>
                </div>

                {resource.matieres?.name && (
                  <div className="space-y-1">
                    <span className="rounded-md bg-canvas-soft px-2 py-0.5 text-caption font-medium text-ink">
                      {resource.matieres.name}
                    </span>
                  </div>
                )}

                <div className="border-t border-hairline pt-3 flex items-center justify-between text-caption text-ink-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(resource.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  {resource.file_size ? (
                    <span>{formatFileSize(resource.file_size)}</span>
                  ) : null}
                </div>

                {/* Boutons d'action pour le fichier */}
                <div className="flex items-center gap-2 pt-1 border-t border-hairline">
                  {resource.signedUrl ? (
                    <>
                      <ResourceViewLogger resourceId={resource.id} action="view">
                        <a
                          href={resource.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary/10 py-1.5 px-3 text-caption font-medium text-primary hover:bg-primary/20 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Consulter
                        </a>
                      </ResourceViewLogger>
                      <ResourceViewLogger resourceId={resource.id} action="download">
                        <a
                          href={resource.signedUrl}
                          download={resource.title}
                          className="inline-flex items-center justify-center rounded-md border border-hairline p-1.5 text-ink-muted hover:text-ink hover:bg-canvas-soft transition-colors"
                          title="Télécharger"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </ResourceViewLogger>
                    </>
                  ) : (
                    <span className="text-caption text-ink-faint italic py-1">Fichier indisponible</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function getResourceTypeIcon(type: ResourceType) {
  switch (type) {
    case 'cours':
      return <BookOpen className="h-5 w-5" />
    case 'tp':
    case 'examen':
    case 'td':
    case 'fiche':
      return <FileText className="h-5 w-5" />
    default:
      return <FileText className="h-5 w-5" />
  }
}