import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import { FiliereForm } from './filiere-form'
import { DeleteFiliereButton } from './delete-button'
import { GraduationCap } from 'lucide-react'

export const metadata = { title: 'Edulink - Filières' }

export default async function FiliereAdminPage() {
  const supabase = await createClient()
  const { data: filieres } = await supabase
    .from('filieres')
    .select('*')
    .order('name')

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Filières</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Gérez les filières de l'établissement.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-title">Liste des filières</CardTitle>
              <CardDescription>{filieres?.length ?? 0} filière(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {filieres && filieres.length > 0 ? (
                <ul className="divide-y divide-hairline">
                  {filieres.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-md bg-accent-purple/20 p-2 text-accent-purple-deep">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-ink">
                            {f.name}
                            <span className="ml-2 text-caption text-ink-faint">({f.code})</span>
                          </p>
                          {f.description && (
                            <p className="text-body-sm text-ink-muted">{f.description}</p>
                          )}
                          <p className="mt-1 text-caption text-ink-faint">Créée le {formatDate(f.created_at)}</p>
                        </div>
                      </div>
                      <DeleteFiliereButton id={f.id} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="Aucune filière"
                  description="Créez votre première filière avec le formulaire."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-title">Ajouter une filière</CardTitle>
              <CardDescription>Nom, code et description.</CardDescription>
            </CardHeader>
            <CardContent>
              <FiliereForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}