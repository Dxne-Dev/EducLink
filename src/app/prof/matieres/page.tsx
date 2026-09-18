import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { BookMarked, GraduationCap, BookOpen, FileText } from 'lucide-react'

export const metadata = { title: 'Edulink — Mes Matières (Enseignant)' }

export default async function ProfMesMatieresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
    redirect('/etudiant/dashboard')
  }

  // Récupérer le registre si l'enseignant a été assigné avant l'activation
  const { data: registryEntry } = await supabase
    .from('teacher_registry')
    .select('id')
    .ilike('email', user.email || '')
    .maybeSingle()

  // Matières assignées via teacher_matieres
  let tmQuery = supabase
    .from('teacher_matieres')
    .select(`
      matiere_id,
      matieres(
        id, name, code,
        niveaux(
          id, name,
          filieres(id, name, code)
        )
      )
    `)

  if (registryEntry?.id) {
    tmQuery = tmQuery.or(`teacher_id.eq.${user.id},teacher_registry_id.eq.${registryEntry.id}`)
  } else {
    tmQuery = tmQuery.eq('teacher_id', user.id)
  }

  const { data: tmRows } = await tmQuery

  // Dédupliquer
  const matieresMap = new Map<string, any>()
  for (const row of tmRows ?? []) {
    const m = (row as any).matieres
    if (m && !matieresMap.has(m.id)) {
      matieresMap.set(m.id, m)
    }
  }
  const matieres = Array.from(matieresMap.values())

  // Nombre de ressources publiées par matière
  let resourceCounts: Record<string, number> = {}
  if (matieres.length > 0) {
    const matiereIds = matieres.map((m) => m.id)
    const { data: resCounts } = await supabase
      .from('resources')
      .select('matiere_id')
      .eq('uploaded_by', user.id)
      .in('matiere_id', matiereIds)

    for (const r of resCounts ?? []) {
      resourceCounts[r.matiere_id] = (resourceCounts[r.matiere_id] ?? 0) + 1
    }
  }

  // Grouper par filière
  const byFiliere = new Map<string, { filiere: any; matieres: any[] }>()
  for (const m of matieres) {
    const filiere = m.niveaux?.filieres
    if (!filiere) continue
    if (!byFiliere.has(filiere.id)) {
      byFiliere.set(filiere.id, { filiere, matieres: [] })
    }
    byFiliere.get(filiere.id)!.matieres.push(m)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Mes Matières</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Matières qui vous ont été attribuées par l'administration. Lecture seule.
        </p>
      </div>

      {matieres.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Aucune matière assignée"
              description="L'administrateur ne vous a pas encore attribué de matières. Contactez-le pour être configuré."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(byFiliere.values()).map(({ filiere, matieres: fMatieres }) => (
            <Card key={filiere.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle className="text-heading-3">{filiere.name}</CardTitle>
                    <CardDescription>Code filière : {filiere.code}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-hairline">
                  {fMatieres.map((m) => {
                    const count = resourceCounts[m.id] ?? 0
                    return (
                      <div
                        key={m.id}
                        className="flex flex-wrap items-center justify-between gap-4 py-4"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-accent-teal/15 text-accent-teal">
                            <BookMarked className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-semibold text-ink text-body-md">{m.name}</p>
                            <p className="text-caption text-ink-muted">
                              Code : <span className="font-mono">{m.code}</span>
                              {' · '}
                              Niveau : {m.niveaux?.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas-soft px-3 py-1 text-caption text-ink-muted">
                            <FileText className="h-3.5 w-3.5" />
                            {count} ressource{count !== 1 ? 's' : ''}
                          </span>
                          <Link
                            href={`/prof/mes-cours?matiere=${encodeURIComponent(m.code || m.id)}`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-white px-3 py-1.5 text-caption font-medium text-ink transition-colors hover:bg-canvas-soft"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            Voir mes docs
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-body-sm text-amber-800">
        <strong>Note :</strong> Pour modifier vos affectations de matières, contactez l'administrateur de la plateforme.
      </div>
    </div>
  )
}
