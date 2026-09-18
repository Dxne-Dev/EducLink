import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatFileSize } from '@/lib/utils'
import {
  Briefcase,
  FileCode,
  Compass,
  Award,
  Download,
  ExternalLink,
  GraduationCap,
  Clock,
  CheckCircle2,
} from 'lucide-react'

export const metadata = { title: 'Edulink — Espace Stage & Méthodologie' }

export default async function StudentStagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // 1. Profil étudiant et filière
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      filiere_id,
      niveau_id,
      role,
      full_name,
      filieres(id, name, code)
    `)
    .eq('id', user.id)
    .single()

  const rawFiliere = profile?.filieres as unknown
  const filiereInfo = (Array.isArray(rawFiliere) ? rawFiliere[0] : rawFiliere) as { id: string; name: string; code: string } | null
  const studentFiliereId = filiereInfo?.id || profile?.filiere_id

  // 2. Récupérer l'ensemble des templates (gabarits, guides, exemples) filtrés pour sa filière ou généraux
  let templatesQuery = supabase
    .from('templates')
    .select('id, name, description, category, file_path, file_size, created_at, filiere_id')
    .order('created_at', { ascending: false })

  if (studentFiliereId) {
    templatesQuery = templatesQuery.or(`filiere_id.is.null,filiere_id.eq.${studentFiliereId}`)
  }

  // 3. Récupérer les exemples de rapports archivés pour sa filière
  let reportsQuery = supabase
    .from('internship_reports')
    .select(`
      id,
      file_path,
      file_size,
      validated_at,
      internships (
        subject,
        company_name,
        grade,
        profiles (full_name, filiere_id),
        promotions (name)
      )
    `)
    .eq('is_validated', true)
    .order('validated_at', { ascending: false })

  const [templatesRes, reportsRes] = await Promise.all([
    templatesQuery,
    reportsQuery,
  ])

  // Filtrer les rapports pour sa filière
  let rawReports = reportsRes.data ?? []
  if (studentFiliereId && rawReports.length > 0) {
    const filiereReports = rawReports.filter(
      (r: any) => (r.internships?.profiles as any)?.filiere_id === studentFiliereId
    )
    if (filiereReports.length > 0) {
      rawReports = filiereReports
    }
  }

  // 4. Générer les Signed URLs sécurisées
  const allTemplates = await Promise.all(
    (templatesRes.data ?? []).map(async (t) => {
      let signedUrl: string | null = null
      if (t.file_path) {
        const { data: signedData } = await supabase.storage
          .from('templates')
          .createSignedUrl(t.file_path, 3600)
        signedUrl = signedData?.signedUrl || null
      }
      return { ...t, signedUrl }
    })
  )

  const validatedReports = await Promise.all(
    rawReports.map(async (r: any) => {
      let signedUrl: string | null = null
      if (r.file_path) {
        const { data: signedData } = await supabase.storage
          .from('internships')
          .createSignedUrl(r.file_path, 3600)
        signedUrl = signedData?.signedUrl || null
      }
      return { ...r, signedUrl }
    })
  )

  // Ventiler par utilité
  const gabarits = allTemplates.filter((t) => t.category === 'gabarit' || t.name.toLowerCase().includes('gabarit') || t.name.toLowerCase().includes('latex') || t.name.toLowerCase().includes('word'))
  const guides = allTemplates.filter((t) => ['guide', 'convention', 'evaluation', 'cv', 'lettre'].includes(t.category) || (!gabarits.includes(t) && t.category !== 'exemple'))
  const exemples = [
    ...allTemplates.filter((t) => t.category === 'exemple'),
    ...validatedReports,
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* En-tête de l'espace Stage */}
      <div className="border-b border-hairline pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-heading-2 text-ink">Espace Méthodologie & Stages</h1>
              {filiereInfo && (
                <Badge variant="purple" className="flex items-center gap-1 font-semibold">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {filiereInfo.code || filiereInfo.name}
                </Badge>
              )}
            </div>
            <p className="mt-1.5 text-body-md text-ink-muted">
              Catalogue méthodologique en libre-service : gabarits officiels, orientation thématique par filière et guides d'insertion professionnelle.
            </p>
          </div>
        </div>

        {/* Bannière de présentation des 3 piliers */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg border border-hairline bg-canvas-soft/70 p-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-purple/15 text-accent-purple-deep">
              <FileCode className="h-4 w-4" />
            </span>
            <div>
              <p className="font-semibold text-body-sm text-ink">Gabarits Officiels</p>
              <p className="text-caption text-ink-muted">Trames Word & LaTeX prêtes à l'emploi</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-hairline bg-canvas-soft/70 p-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-teal/15 text-accent-teal">
              <Award className="h-4 w-4" />
            </span>
            <div>
              <p className="font-semibold text-body-sm text-ink">Orientation par Filière</p>
              <p className="text-caption text-ink-muted">Rapports & thématiques concrètes</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-hairline bg-canvas-soft/70 p-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-orange/15 text-accent-orange-deep">
              <Compass className="h-4 w-4" />
            </span>
            <div>
              <p className="font-semibold text-body-sm text-ink">Insertion & Suivi</p>
              <p className="text-caption text-ink-muted">Fiches de suivi, CV et soutenance</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 PILIER 1 : Centralisation des Gabarits Officiels (Word / LaTeX) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-title font-semibold text-ink flex items-center gap-2">
              <FileCode className="h-5 w-5 text-accent-purple-deep" />
              1. Gabarits Officiels de Rapports (Word & LaTeX)
            </h2>
            <p className="text-caption text-ink-muted">
              Mises en page et structures typographiques exigées par l'établissement. Téléchargez le gabarit pour démarrer directement votre rédaction.
            </p>
          </div>
        </div>

        {gabarits.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <EmptyState
                title="Gabarits officiels en cours de déploiement"
                description="L'administration mettra prochainement en ligne les fichiers sources Word (.docx) et LaTeX (.zip) officiels."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gabarits.map((g) => (
              <Card key={g.id} className="transition-all hover:shadow-level-1 flex flex-col justify-between border-accent-purple/30 bg-accent-purple/5">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-content-center rounded-lg bg-accent-purple/20 text-accent-purple-deep font-semibold">
                      <FileCode className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-accent-purple/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-purple-deep">
                          Gabarit Officiel
                        </span>
                      </div>
                      <h3 className="font-semibold text-ink text-title truncate mt-1" title={g.name}>
                        {g.name}
                      </h3>
                      {g.description && (
                        <p className="text-caption text-ink-muted line-clamp-2 mt-1">{g.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-accent-purple-deep font-medium pt-1">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Conforme aux exigences académiques</span>
                  </div>

                  <div className="border-t border-hairline pt-3 flex items-center justify-between text-caption text-ink-muted">
                    <span>{g.file_size ? formatFileSize(g.file_size) : 'Archive source'}</span>
                    <span>{formatDate(g.created_at)}</span>
                  </div>

                  {g.signedUrl && (
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={g.signedUrl}
                        download={g.name}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-accent-purple/20 py-2 px-3 text-caption font-semibold text-accent-purple-deep hover:bg-accent-purple/30 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Télécharger le gabarit
                      </a>
                      <a
                        href={g.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md border border-hairline p-2 text-ink-muted hover:text-ink hover:bg-canvas-soft transition-colors"
                        title="Consulter en ligne"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 🚀 PILIER 2 : Orientation par Filière (Exemples Concrets & Thématiques Types) */}
      <section className="space-y-4 pt-4 border-t border-hairline">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-title font-semibold text-ink flex items-center gap-2">
              <Award className="h-5 w-5 text-accent-teal" />
              2. Orientation & Exemples Types — {filiereInfo?.name || 'Votre Filière'}
            </h2>
          </div>
          <p className="text-caption text-ink-muted">
            Exemples de rapports réels et thématiques techniques adaptés aux spécificités de votre formation pour vous inspirer.
          </p>
        </div>

        {exemples.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <EmptyState
                title="Aucun exemple archivé pour cette filière"
                description="Les rapports validés et exemples types de projets apparaîtront ici au fil des sessions académiques."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exemples.map((item: any) => {
              const isTemplate = 'name' in item
              const title = isTemplate ? item.name : item.internships?.subject || 'Rapport de stage'
              const company = !isTemplate ? item.internships?.company_name : null
              const promo = !isTemplate ? item.internships?.promotions?.name : null
              const grade = !isTemplate ? item.internships?.grade : null
              const description = isTemplate ? item.description : null

              return (
                <Card key={item.id} className="transition-all hover:shadow-level-1 flex flex-col justify-between">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-content-center rounded-lg bg-accent-teal/15 text-accent-teal">
                        <Award className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="rounded bg-accent-teal/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-teal">
                            Exemple Thématique
                          </span>
                          {grade != null && (
                            <Badge variant="success" className="text-[10px] py-0">
                              {grade}/20
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-ink text-title truncate mt-1" title={title}>
                          {title}
                        </h3>
                        {description && (
                          <p className="text-caption text-ink-muted line-clamp-2 mt-1">{description}</p>
                        )}
                        {company && (
                          <p className="text-caption text-ink-muted flex items-center gap-1 mt-1">
                            <Briefcase className="h-3 w-3 shrink-0" />
                            {company}
                          </p>
                        )}
                        {promo && (
                          <p className="text-caption text-ink-faint flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3 shrink-0" />
                            {promo}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-hairline pt-3 flex items-center justify-between text-caption text-ink-muted">
                      <span>{item.file_size ? formatFileSize(item.file_size) : 'Exemple PDF'}</span>
                      <span>{formatDate(item.created_at || item.validated_at)}</span>
                    </div>

                    {item.signedUrl && (
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={item.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-accent-teal/15 py-1.5 px-3 text-caption font-medium text-accent-teal hover:bg-accent-teal/25 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Consulter l'exemple
                        </a>
                        <a
                          href={item.signedUrl}
                          download={title}
                          className="inline-flex items-center justify-center rounded-md border border-hairline p-1.5 text-ink-muted hover:text-ink hover:bg-canvas-soft transition-colors"
                          title="Télécharger"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* 🚀 PILIER 3 : Guides Méthodologiques & Insertion Professionnelle */}
      <section className="space-y-4 pt-4 border-t border-hairline">
        <div>
          <h2 className="text-title font-semibold text-ink flex items-center gap-2">
            <Compass className="h-5 w-5 text-accent-orange-deep" />
            3. Guides Méthodologiques & Insertion Professionnelle
          </h2>
          <p className="text-caption text-ink-muted">
            Guides pour réussir sa recherche de stage, fiches de suivi d'immersion, trames de soutenance orale et conventions types.
          </p>
        </div>

        {guides.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <EmptyState
                title="Aucun guide méthodologique disponible"
                description="Les guides de préparation et modèles administratifs seront publiés par l'administration."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((g) => (
              <Card key={g.id} className="transition-all hover:shadow-level-1 flex flex-col justify-between">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-content-center rounded-lg bg-accent-orange/15 text-accent-orange-deep font-semibold">
                      <Compass className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="rounded bg-accent-orange/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-orange-deep">
                        {getGuideBadgeLabel(g.category)}
                      </span>
                      <h3 className="font-semibold text-ink text-title truncate mt-1" title={g.name}>
                        {g.name}
                      </h3>
                      {g.description && (
                        <p className="text-caption text-ink-muted line-clamp-2 mt-1">{g.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-hairline pt-3 flex items-center justify-between text-caption text-ink-muted">
                    <span>{g.file_size ? formatFileSize(g.file_size) : 'Document type'}</span>
                    <span>{formatDate(g.created_at)}</span>
                  </div>

                  {g.signedUrl && (
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={g.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-accent-orange/15 py-1.5 px-3 text-caption font-medium text-accent-orange-deep hover:bg-accent-orange/25 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Consulter
                      </a>
                      <a
                        href={g.signedUrl}
                        download={g.name}
                        className="inline-flex items-center justify-center rounded-md border border-hairline p-1.5 text-ink-muted hover:text-ink hover:bg-canvas-soft transition-colors"
                        title="Télécharger"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function getGuideBadgeLabel(cat: string) {
  switch (cat) {
    case 'guide':
      return 'Guide méthodologique'
    case 'convention':
      return 'Convention type'
    case 'evaluation':
      return 'Grille d\'évaluation'
    case 'cv':
      return 'Modèle CV & Candidature'
    case 'lettre':
      return 'Lettre de motivation'
    default:
      return 'Ressource d\'insertion'
  }
}
