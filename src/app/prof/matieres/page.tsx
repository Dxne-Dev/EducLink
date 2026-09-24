import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { BookMarked, GraduationCap, BookOpen, FileText, Plus, Info } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'

import { Icon } from '@/components/ui/Icon'

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

  const breadcrumb = [
    { label: 'Espace Enseignant', href: '/prof/mes-cours' },
    { label: 'Mes Matières' },
  ]

  const headerAction = (
    <Link
      href="/prof/cours/upload"
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-body-sm font-semibold text-white shadow-xs transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
    >
      <Plus className="h-4 w-4" />
      <span>Publier un cours</span>
    </Link>
  )

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <PageHeader
        breadcrumb={breadcrumb}
        title="Mes Matières Enseignées"
        subtitle="Consultez les modules et matières officiellement affectés à votre compte enseignant."
        actions={headerAction}
      />

      {matieres.length === 0 ? (
        <Card className="rounded-3xl border border-hairline bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="py-12">
            <EmptyState
              icon={<Icon name="solar:book-bookmark-bold-duotone" className="text-4xl text-accent-teal" />}
              title="Aucune matière assignée"
              description="L'administration universitaire ne vous a pas encore attribué de matières. Veuillez contacter le secrétariat académique."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(byFiliere.values()).map(({ filiere, matieres: fMatieres }) => (
            <Card
              key={filiere.id}
              className="rounded-3xl border border-hairline bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-purple/15 text-accent-purple-deep dark:bg-purple-900/30 dark:text-purple-300 shadow-sm ring-1 ring-accent-purple/20">
                      <Icon name="solar:diploma-verified-bold-duotone" className="text-2xl" />
                    </div>
                    <div>
                      <CardTitle className="text-title text-ink dark:text-slate-100">
                        {filiere.name}
                      </CardTitle>
                      <CardDescription className="text-caption text-ink-muted dark:text-slate-400 mt-0.5">
                        Code filière : <span className="font-mono font-semibold">{filiere.code}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="purple" className="px-2.5 py-1">
                    {fMatieres.length} matière{fMatieres.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 sm:pt-0">
                <div className="divide-y divide-hairline dark:divide-slate-800">
                  {fMatieres.map((m) => {
                    const count = resourceCounts[m.id] ?? 0
                    return (
                      <div
                        key={m.id}
                        className="flex flex-wrap items-center justify-between gap-4 py-4 px-4 sm:px-0 transition-colors hover:bg-canvas-soft/40 sm:hover:bg-transparent dark:hover:bg-slate-800/20"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-teal/15 text-accent-teal dark:bg-teal-900/30 dark:text-teal-300 shadow-sm ring-1 ring-accent-teal/20">
                            <Icon name="solar:book-bookmark-bold-duotone" className="text-xl" />
                          </div>
                          <div>
                            <p className="font-semibold text-ink dark:text-slate-100 text-body-md">{m.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-caption text-ink-muted dark:text-slate-400">
                              {m.code && (
                                <span className="font-mono font-semibold text-primary dark:text-sky-400">
                                  {m.code}
                                </span>
                              )}
                              <span>•</span>
                              <span>Niveau : <strong className="text-ink-secondary dark:text-slate-300">{m.niveaux?.name}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-hairline dark:border-slate-800 bg-canvas-soft dark:bg-slate-800 px-3 py-1.5 text-caption font-medium text-ink-muted dark:text-slate-300">
                            <Icon name="solar:document-text-bold-duotone" className="text-sm text-primary" />
                            {count} document{count > 1 ? 's' : ''}
                          </span>
                          <Link
                            href={`/prof/mes-cours?matiere=${encodeURIComponent(m.code || m.id)}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-hairline dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-caption font-semibold text-ink dark:text-slate-200 transition-colors hover:bg-canvas-soft dark:hover:bg-slate-800 shadow-xs"
                          >
                            <Icon name="solar:folder-open-bold-duotone" className="text-sm text-accent-teal" />
                            Voir les cours
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

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-body-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200 shadow-xs">
        <Info className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <p className="text-caption leading-relaxed">
          <strong>Information académique :</strong> Les affectations de matières sont gérées par la direction des études. Si un module est manquant ou si vous changez d'attribution pour ce semestre, contactez l'administrateur.
        </p>
      </div>
    </div>
  )
}
