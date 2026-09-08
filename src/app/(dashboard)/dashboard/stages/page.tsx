import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import { InternshipForm } from './internship-form'
import { Briefcase } from 'lucide-react'

export const metadata = { title: 'Edulink - Stages' }

export default async function StagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profile, reports, myInternships] = await Promise.all([
    user
      ? supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from('internship_reports')
      .select(`
        *,
        internships(company_name, subject, student_id, profiles(full_name), promotions(name)),
        profiles(full_name)
      `)
      .eq('is_validated', true)
      .order('validated_at', { ascending: false }),
    user
      ? supabase.from('internships').select('*').eq('student_id', user.id)
      : Promise.resolve({ data: [] }),
  ])

  const role = profile?.data?.role
  const isStudent = role === 'student'
  const isAdmin = role === 'admin'

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Espace Stage</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Consultez les rapports de stage validés et gérez votre stage.
        </p>
      </div>

      {isStudent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-title">Mon stage</CardTitle>
            <CardDescription>
              {myInternships.data && myInternships.data.length > 0
                ? `${myInternships.data.length} stage(s) déclaré(s)`
                : 'Déclarez votre stage pour permettre le dépôt de votre rapport.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myInternships.data && myInternships.data.length > 0 ? (
              <ul className="divide-y divide-hairline">
                {myInternships.data.map((i) => (
                  <li key={i.id} className="py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink">{i.company_name}</p>
                      <Badge variant={i.status === 'validated' ? 'success' : 'warning'}>
                        {i.status === 'validated' ? 'Validé' : 'En attente'}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-body-sm text-ink-muted">{i.subject}</p>
                    <p className="mt-0.5 text-caption text-ink-faint">
                      {formatDate(i.start_date)} → {formatDate(i.end_date)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <InternshipForm />
            )}
          </CardContent>
        </Card>
      )}

      {isAdmin && <AdminUploadNote />}

      <Card>
        <CardHeader>
          <CardTitle className="text-title">Rapports de stage validés</CardTitle>
          <CardDescription>{reports.data?.length ?? 0} rapport(s) disponible(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {reports.data && reports.data.length > 0 ? (
            <ul className="divide-y divide-hairline">
              {reports.data.map((r) => {
                const internship = r.internships
                return (
                  <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-accent-teal/15 p-2 text-accent-teal">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-ink">
                          {internship?.subject ?? 'Rapport de stage'}
                        </p>
                        <p className="text-body-sm text-ink-muted">
                          {internship?.company_name} · {internship?.profiles?.full_name}
                        </p>
                        <p className="mt-0.5 text-caption text-ink-faint">
                          {internship?.promotions?.name} · validé le {r.validated_at ? formatDate(r.validated_at) : '—'}
                        </p>
                      </div>
                    </div>
                    {r.grade != null && (
                      <Badge variant="success">Note : {r.grade}/20</Badge>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState
              title="Aucun rapport validé"
              description="Les rapports validés apparaîtront ici."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AdminUploadNote() {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <p className="text-body-sm text-ink-muted">
          Gérez l'upload, la validation et la notation des rapports.
        </p>
        <a href="/admin/rapports" className="shrink-0 text-body-sm font-medium text-primary hover:underline">
          Aller à l'administration →
        </a>
      </CardContent>
    </Card>
  )
}