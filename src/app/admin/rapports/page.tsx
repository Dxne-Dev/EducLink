import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatFileSize } from '@/lib/utils'
import { TemplateForm } from '@/app/(dashboard)/dashboard/templates/template-form'
import { TemplateDeleteButton } from '@/app/(dashboard)/dashboard/templates/template-delete-button'
import { ReportUploadForm } from './report-upload-form'
import { ReportValidateButton } from './report-validate-button'
import { ReportDeleteButton } from './report-delete-button'
import { Briefcase, FileCode, Compass, Award, FileText, Plus, Download, GraduationCap } from 'lucide-react'

export const metadata = { title: 'Edulink - Gestion des Stages & Gabarits' }

export default async function RapportsAdminPage() {
  const supabase = await createClient()

  const [internshipsRes, filieresRes, templatesRes] = await Promise.all([
    supabase
      .from('internships')
      .select(`
        *,
        profiles(full_name),
        promotions(name),
        internship_reports(id, file_path, is_validated, grade, validated_at)
      `)
      .order('created_at', { ascending: false }),
    supabase.from('filieres').select('id, name, code').order('name'),
    supabase
      .from('templates')
      .select('*, filieres(id, name, code)')
      .order('created_at', { ascending: false }),
  ])

  const internships = internshipsRes.data ?? []
  const filieresList = filieresRes.data ?? []
  const templatesList = templatesRes.data ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-heading-2 text-ink">Espace Stage & Gabarits Officiels</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Alimentez le catalogue en libre-service (gabarits Word/LaTeX, guides méthodologiques, exemples par filière) et suivez les stages des étudiants.
        </p>
      </div>

      {/* BLOC 1 : Approvisionnement du Catalogue (Gabarits & Guides) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulaire d'ajout rapide */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Plus className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle className="text-title">Déposer une ressource</CardTitle>
                  <CardDescription>Gabarit, guide ou exemple</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TemplateForm filieres={filieresList} />
            </CardContent>
          </Card>
        </div>

        {/* Liste des documents du catalogue */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-title">Ressources en libre-service ({templatesList.length})</CardTitle>
              <CardDescription>Documents actuellement accessibles aux étudiants selon leur filière</CardDescription>
            </CardHeader>
            <CardContent>
              {templatesList.length === 0 ? (
                <EmptyState
                  title="Aucun document déposé"
                  description="Déposez le gabarit Word/LaTeX officiel ou un guide méthodologique pour vos étudiants."
                />
              ) : (
                <div className="space-y-3">
                  {templatesList.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline p-4 transition-colors hover:bg-canvas-soft/40"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {getCategoryIcon(t.category)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-ink text-body-md truncate">{t.name}</p>
                            <Badge variant="secondary" className="text-[10px]">
                              {getCategoryBadgeLabel(t.category)}
                            </Badge>
                            {t.filieres ? (
                              <Badge variant="purple" className="text-[10px]">
                                <GraduationCap className="mr-1 h-3 w-3" />
                                {t.filieres.code || t.filieres.name}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                Tronc commun / Tous
                              </Badge>
                            )}
                          </div>
                          {t.description && (
                            <p className="text-caption text-ink-muted line-clamp-1 mt-0.5">{t.description}</p>
                          )}
                          <p className="text-caption text-ink-faint mt-1">
                            {t.file_size ? formatFileSize(t.file_size) : 'Fichier'} · Ajouté le {formatDate(t.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <TemplateDeleteButton id={t.id} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BLOC 2 : Suivi et Validation des Déclarations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-title">Suivi des stages déclarés par les étudiants</CardTitle>
          <CardDescription>{internships.length} stage(s) déclaré(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {internships.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="h-6 w-6 text-ink-faint" />}
              title="Aucun stage déclaré"
              description="Les stages déclarés par les étudiants apparaîtront ici pour validation académique."
            />
          ) : (
            <div className="space-y-4">
              {internships.map((i) => {
                const report = i.internship_reports?.[0] ?? null
                return (
                  <div key={i.id} className="rounded-lg border border-hairline p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-ink">{i.subject}</p>
                          {report ? (
                            report.is_validated ? (
                              <Badge variant="success">Validé</Badge>
                            ) : (
                              <Badge variant="warning">Rapport déposé</Badge>
                            )
                          ) : (
                            <Badge variant="secondary">Pas de rapport</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-body-sm text-ink-muted">
                          {i.company_name} · {i.profiles?.full_name} · {i.promotions?.name}
                        </p>
                        <p className="mt-0.5 text-caption text-ink-faint">
                          {formatDate(i.start_date)} → {formatDate(i.end_date)}
                          {report?.validated_at ? ` · validé le ${formatDate(report.validated_at)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {report && !report.is_validated && (
                          <ReportValidateButton reportId={report.id} />
                        )}
                        {report && report.is_validated && report.grade != null && (
                          <Badge variant="success">Note : {report.grade}/20</Badge>
                        )}
                        {report && <ReportDeleteButton reportId={report.id} />}
                      </div>
                    </div>
                    {(!report || !report.is_validated) && <ReportUploadForm internshipId={i.id} />}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getCategoryIcon(cat: string) {
  switch (cat) {
    case 'gabarit':
      return <FileCode className="h-4 w-4" />
    case 'guide':
      return <Compass className="h-4 w-4" />
    case 'exemple':
      return <Award className="h-4 w-4" />
    case 'convention':
      return <FileText className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

function getCategoryBadgeLabel(cat: string) {
  switch (cat) {
    case 'gabarit':
      return 'Gabarit officiel'
    case 'guide':
      return 'Guide méthodologique'
    case 'exemple':
      return 'Exemple type'
    case 'convention':
      return 'Convention'
    case 'evaluation':
      return 'Grille d\'évaluation'
    case 'cv':
      return 'Modèle CV'
    case 'lettre':
      return 'Lettre'
    default:
      return 'Autre'
  }
}