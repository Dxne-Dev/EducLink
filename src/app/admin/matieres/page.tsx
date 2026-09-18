import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { NiveauForm } from './niveau-form'
import { MatiereForm } from './matiere-form'
import { DeleteButton } from './delete-button'
import { GraduationCap, BookOpen } from 'lucide-react'

export const metadata = { title: 'Edulink - Matières & Niveaux' }

export default async function MatiereAdminPage() {
  const supabase = await createClient()

  const [filieres, niveaux, matieres] = await Promise.all([
    supabase.from('filieres').select('id, name').order('name'),
    supabase.from('niveaux').select('id, name, filiere_id').order('sort_order'),
    supabase.from('matieres').select('id, name, code, niveau_id').order('name'),
  ])

  const filieresList = filieres.data ?? []
  const niveauxList = niveaux.data ?? []
  const matieresList = matieres.data ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Matières & Niveaux</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Organisez les niveaux et matières par filière.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-title">Arborescence</CardTitle>
              <CardDescription>Filière › Niveau › Matière</CardDescription>
            </CardHeader>
            <CardContent>
              {filieresList.length === 0 ? (
                <EmptyState
                  title="Aucune filière"
                  description="Créez d'abord des filières dans la section Filières."
                />
              ) : (
                <div className="space-y-6">
                  {filieresList.map((f) => {
                    const fNiveaux = niveauxList.filter((n) => n.filiere_id === f.id)
                    return (
                      <div key={f.id}>
                        <div className="flex items-center gap-2 font-medium text-ink">
                          <GraduationCap className="h-4 w-4 text-accent-purple-deep" />
                          {f.name}
                          <span className="text-caption text-ink-faint">({fNiveaux.length} niveau{fNiveaux.length > 1 ? 'x' : ''})</span>
                        </div>
                        <div className="mt-2 space-y-3 pl-6">
                          {fNiveaux.length === 0 && (
                            <p className="text-body-sm text-ink-faint">Aucun niveau pour cette filière.</p>
                          )}
                          {fNiveaux.map((n) => {
                            const nMatiere = matieresList.filter((m) => m.niveau_id === n.id)
                            return (
                              <div key={n.id}>
                                <div className="flex items-center justify-between rounded-md border border-hairline bg-canvas-soft px-3 py-2">
                                  <span className="text-body-sm font-medium text-ink-secondary">{n.name}</span>
                                  <DeleteButton type="niveau" id={n.id} />
                                </div>
                                <ul className="mt-1 space-y-1 pl-4">
                                  {nMatiere.length === 0 && (
                                    <li className="py-1 text-caption text-ink-faint">Aucune matière.</li>
                                  )}
                                  {nMatiere.map((m) => (
                                    <li key={m.id} className="flex items-center justify-between py-1 text-body-sm text-ink-muted">
                                      <span className="flex items-center gap-2">
                                        <BookOpen className="h-3.5 w-3.5 text-accent-teal" />
                                        {m.name}
                                        {m.code && <span className="text-caption text-ink-faint">({m.code})</span>}
                                      </span>
                                      <DeleteButton type="matiere" id={m.id} />
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-title">Ajouter un niveau</CardTitle>
              <CardDescription>Niveau rattaché à une filière.</CardDescription>
            </CardHeader>
            <CardContent>
              <NiveauForm filieres={filieresList} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-title">Ajouter une matière</CardTitle>
              <CardDescription>Matière rattachée à un niveau.</CardDescription>
            </CardHeader>
            <CardContent>
              <MatiereForm filieres={filieresList} niveaux={niveauxList} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}