import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import { ReportUploadForm } from './report-upload-form'
import { ReportValidateButton } from './report-validate-button'
import { ReportDeleteButton } from './report-delete-button'
import { Briefcase } from 'lucide-react'

export const metadata = { title: 'Edulink - Rapports de stage' }

export default async function RapportsAdminPage() {
  const supabase = await createClient()

  const { data: internships } = await supabase
    .from('internships')
    .select(`
      *,
      profiles(full_name),
      promotions(name),
      internship_reports(id, file_path, is_validated, grade, validated_at)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Rapports de stage</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Déposez, validez et notez les rapports de stage des étudiants.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-title">Stages déclarés</CardTitle>
          <CardDescription>{internships?.length ?? 0} stage(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {internships && internships.length > 0 ? (
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
          ) : (
            <EmptyState
              icon={<Briefcase className="h-6 w-6 text-ink-faint" />}
              title="Aucun stage déclaré"
              description="Les stages déclarés par les étudiants apparaîtront ici."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}