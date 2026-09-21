import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatFileSize } from '@/lib/utils'
import { TemplateForm } from '@/app/(dashboard)/dashboard/templates/template-form'
import { TemplateDeleteButton } from '@/app/(dashboard)/dashboard/templates/template-delete-button'
import { FileCode, Compass, Award, FileText, Plus, GraduationCap } from 'lucide-react'

export const metadata = { title: 'Edulink - Gabarits & Ressources' }

export default async function RapportsAdminPage() {
  const supabase = await createClient()

  const [filieresRes, templatesRes] = await Promise.all([
    supabase.from('filieres').select('id, name, code').order('name'),
    supabase
      .from('templates')
      .select('*, filieres(id, name, code)')
      .order('created_at', { ascending: false }),
  ])

  const filieresList = filieresRes.data ?? []
  const templatesList = templatesRes.data ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-heading-2 text-ink">Espace Gabarits & Ressources</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Alimentez le catalogue en libre-service (gabarits Word/LaTeX, guides méthodologiques, exemples par filière).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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