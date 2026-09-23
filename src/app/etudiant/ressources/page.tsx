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
  Library,
} from 'lucide-react'
import Link from 'next/link'
import type { ResourceType } from '@/types/database'
import { formatFileSize, formatDate } from '@/lib/utils'
import { RESOURCE_TYPE_LABELS } from '@/lib/constants'
import { RealtimeResourcesWatcher } from '@/components/realtime/RealtimeResourcesWatcher'
import { PageHeader } from '@/components/layout/PageHeader'

export const metadata = { title: 'Edulink - Mes Ressources' }

interface StudentRessourcesPageProps {
  searchParams?: Promise<{ uploader?: string; prof?: string; matiere?: string }>
}

const TYPE_STICKER: Record<string, string> = {
  cours: 'bg-accent-purple/20 text-accent-purple-deep dark:bg-purple-900/30 dark:text-purple-300',
  fiche: 'bg-accent-teal/15 text-accent-teal dark:bg-teal-900/30 dark:text-teal-300',
  tp: 'bg-accent-orange/15 text-accent-orange-deep dark:bg-amber-900/30 dark:text-amber-300',
  examen: 'bg-accent-pink/15 text-accent-pink dark:bg-rose-900/30 dark:text-rose-300',
  td: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
}

export default async function StudentRessourcesPage({ searchParams }: StudentRessourcesPageProps) {
  const params = await searchParams
  const profNameParam = params?.prof
  const uploaderParam = params?.uploader
  const matiereParam = params?.matiere

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

  let targetUploaderId: string | null = null
  let activeTeacherName: string | null = null

  if (profNameParam) {
    const { data: profProfile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .ilike('full_name', profNameParam.trim())
      .maybeSingle()

    if (profProfile) {
      targetUploaderId = profProfile.id
      activeTeacherName = profProfile.full_name
    } else {
      activeTeacherName = profNameParam
    }
  } else if (uploaderParam) {
    targetUploaderId = uploaderParam
    const { data: profProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', uploaderParam)
      .maybeSingle()
    if (profProfile) {
      activeTeacherName = profProfile.full_name
    }
  }

  let targetMatiereId: string | null = null
  let activeMatiereName: string | null = null

  if (matiereParam) {
    const { data: matData } = await supabase
      .from('matieres')
      .select('id, name, code')
      .or(`code.ilike.${matiereParam},id.eq.${matiereParam}`)
      .maybeSingle()

    if (matData) {
      targetMatiereId = matData.id
      activeMatiereName = `${matData.name}${matData.code ? ` (${matData.code})` : ''}`
    } else {
      targetMatiereId = matiereParam
    }
  }

  let resources: any[] = []

  if (studentFiliereId && studentNiveauId) {
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

    if (targetUploaderId) {
      queryNiveau = queryNiveau.eq('uploaded_by', targetUploaderId)
    }
    if (targetMatiereId) {
      queryNiveau = queryNiveau.eq('matiere_id', targetMatiereId)
    }

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

      if (targetUploaderId) {
        queryShared = queryShared.eq('uploaded_by', targetUploaderId)
      }
      if (targetMatiereId) {
        queryShared = queryShared.eq('matiere_id', targetMatiereId)
      }

      const { data: sharedData } = await queryShared
      sharedResources = sharedData ?? []
    }

    const { data: fetchedNiveauResources } = await queryNiveau

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

    if (fetchedResources && fetchedResources.length > 0) {
      const resourcesWithUrls = await Promise.all(
        fetchedResources.map(async (r) => {
          let signedUrl: string | null = null
          if (r.file_path) {
            const { data: signedData } = await supabase.storage
              .from('resources')
              .createSignedUrl(r.file_path, 3600)
            signedUrl = signedData?.signedUrl || null
          }
          return {
            ...r,
            signedUrl,
          }
        })
      )
      resources = resourcesWithUrls
    }
  }

  const breadcrumb = [
    { label: 'Espace Étudiant', href: '/etudiant/dashboard' },
    { label: 'Mes Ressources' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <RealtimeResourcesWatcher />

      <PageHeader
        breadcrumb={breadcrumb}
        title="Mes Ressources & Documents Pédagogiques"
        subtitle={
          filiereInfo && niveauName
            ? `Supports de cours, TD, examens et fiches pour ${filiereInfo.name} (${niveauName}).`
            : 'Accédez aux ressources déposées par vos professeurs.'
        }
      />

      {/* Barre de filtres actifs */}
      {(targetUploaderId || matiereParam) && (
        <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 px-4 py-3 text-body-sm shadow-xs">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-ink dark:text-slate-100">
              {targetUploaderId && (
                <>
                  Ressources du professeur : <strong>{activeTeacherName}</strong>
                </>
              )}
              {matiereParam && activeMatiereName && (
                <>
                  {targetUploaderId ? ' · ' : ''}Matière : <strong>{activeMatiereName}</strong>
                </>
              )}
            </span>
          </div>
          <Link
            href="/etudiant/ressources"
            className="flex items-center gap-1.5 text-caption font-semibold text-primary dark:text-sky-400 hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            Effacer les filtres
          </Link>
        </div>
      )}

      {/* Liste des ressources */}
      {!studentFiliereId || !studentNiveauId ? (
        <Card className="rounded-3xl border border-hairline bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="py-12">
            <EmptyState
              icon={<GraduationCap className="h-8 w-8 text-ink-faint" />}
              title="Cursus non renseigné"
              description="Veuillez compléter votre filière et niveau dans votre profil pour accéder aux ressources."
            />
          </CardContent>
        </Card>
      ) : resources.length === 0 ? (
        <Card className="rounded-3xl border border-hairline bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="py-12">
            <EmptyState
              icon={<Library className="h-8 w-8 text-ink-faint" />}
              title={targetUploaderId ? 'Aucun document publié par cet enseignant' : 'Aucune ressource disponible'}
              description={
                targetUploaderId
                  ? "Cet enseignant n'a pas encore mis en ligne de support public pour votre promotion."
                  : "Aucune ressource publique n'a encore été publiée pour votre niveau cette année."
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card
              key={resource.id}
              className="flex flex-col justify-between rounded-3xl border border-hairline bg-white shadow-xs transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <CardContent className="p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
                      TYPE_STICKER[resource.type] ?? 'bg-canvas-soft text-ink'
                    }`}
                  >
                    {RESOURCE_TYPE_LABELS[resource.type as keyof typeof RESOURCE_TYPE_LABELS] ?? resource.type}
                  </span>
                  {resource.file_size && (
                    <span className="text-[11px] font-mono text-ink-faint dark:text-slate-400">
                      {formatFileSize(resource.file_size)}
                    </span>
                  )}
                </div>

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

                <div className="space-y-1 rounded-2xl bg-canvas-soft/80 dark:bg-slate-800/60 p-2.5 text-caption border border-hairline dark:border-slate-800">
                  <div className="flex items-center gap-1.5 font-semibold text-ink dark:text-slate-200 truncate">
                    <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{resource.matieres?.name ?? 'Matière'}</span>
                  </div>
                  <p className="text-[11px] text-ink-muted dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Users className="h-3 w-3 shrink-0" />
                    {resource.profiles?.full_name || 'Enseignant officiel'}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-hairline dark:border-slate-800 pt-2.5 text-caption text-ink-muted dark:text-slate-400 font-mono">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="h-3 w-3" />
                    {formatDate(resource.created_at)}
                  </span>
                </div>

                {/* Boutons d'action pour le fichier */}
                <div className="flex items-center gap-2 pt-2 border-t border-hairline dark:border-slate-800">
                  {resource.signedUrl ? (
                    <>
                      <a
                        href={resource.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 dark:bg-primary/20 py-2 px-3 text-caption font-semibold text-primary dark:text-sky-300 hover:bg-primary/20 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Consulter
                      </a>
                      <a
                        href={resource.signedUrl}
                        download={resource.title}
                        className="inline-flex items-center justify-center rounded-xl border border-hairline dark:border-slate-700 p-2 text-ink-muted hover:text-ink hover:bg-canvas-soft dark:hover:bg-slate-800 transition-colors"
                        title="Télécharger"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </>
                  ) : (
                    <span className="text-caption text-ink-faint italic py-1">Fichier non disponible</span>
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
