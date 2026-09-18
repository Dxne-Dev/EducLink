import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { TeacherRegistryForm } from './registry/teacher-registry-form'
import { DeleteTeacherButton } from './registry/delete-teacher-button'
import { AssignMatieresModal } from './assign-matieres-modal'
import { Award, Mail, CheckCircle2, Clock, BookOpen, GraduationCap } from 'lucide-react'

export const metadata = { title: 'Edulink - Enseignants & Affectation Matières' }

export default async function TeachersAdminPage() {
  const supabase = await createClient()

  // Récupérer le registre, les filières, les matières avec leurs niveaux, et les profils enseignants
  const [registryRes, filieresRes, matieresRes, profilesRes, teacherMatieresRes] = await Promise.all([
    supabase
      .from('teacher_registry')
      .select('*, filieres(name, code)')
      .order('created_at', { ascending: false }),
    supabase.from('filieres').select('id, name, code').order('name'),
    supabase
      .from('matieres')
      .select(`
        id,
        name,
        code,
        niveau_id,
        niveaux(
          id,
          name,
          filiere_id,
          filieres(name, code)
        )
      `)
      .order('name'),
    supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('role', 'teacher'),
    supabase
      .from('teacher_matieres')
      .select('id, teacher_id, teacher_registry_id, matiere_id'),
  ])

  const teachers = registryRes.data ?? []
  const filieres = filieresRes.data ?? []
  const matieres = (matieresRes.data ?? []) as any[]
  const teacherProfiles = profilesRes.data ?? []
  const teacherMatieres = teacherMatieresRes.data ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Enseignants & Affectation des Matières</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Habilitez les enseignants officiels et associez-les aux matières qu'ils dispensent pour chaque niveau.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne liste des enseignants */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-title">Corps Enseignant Habilité</CardTitle>
              <CardDescription>
                {teachers.length} enseignant(s) dans le registre universitaire
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teachers.length === 0 ? (
                <EmptyState
                  title="Aucun enseignant habilité"
                  description="Ajoutez des enseignants via le formulaire ci-contre pour autoriser leur inscription et leur affecter des matières."
                />
              ) : (
                <ul className="divide-y divide-hairline">
                  {teachers.map((t: any) => {
                    // Trouver le profil correspondant par email (prioritaire) ou par nom
                    const profile = teacherProfiles.find(
                      (p: any) =>
                        (p.email && t.email && p.email.toLowerCase() === t.email.toLowerCase()) ||
                        p.full_name?.toLowerCase() === t.full_name?.toLowerCase()
                    )

                    const isActivated = Boolean(t.is_used || profile)

                    // Trouver les IDs des matières affectées à cet enseignant (soit par registry_id soit par teacher_id)
                    const assigned = teacherMatieres.filter(
                      (tm: any) =>
                        tm.teacher_registry_id === t.id ||
                        (profile && tm.teacher_id === profile.id)
                    )
                    const assignedMatiereIds = assigned.map((tm: any) => tm.matiere_id)
                    const assignedMatieres = matieres.filter((m) =>
                      assignedMatiereIds.includes(m.id)
                    )

                    return (
                      <li key={t.id} className="py-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-md bg-accent-orange/15 p-2 text-accent-orange-deep">
                              <Award className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-ink">{t.full_name}</p>
                                {isActivated ? (
                                  <Badge variant="success" className="text-[10px]">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Compte activé
                                  </Badge>
                                ) : (
                                  <Badge variant="warning" className="text-[10px]">
                                    <Clock className="h-3 w-3 mr-1" /> En attente
                                  </Badge>
                                )}
                              </div>
                              <p className="text-caption text-ink-muted flex items-center gap-1 mt-0.5">
                                <Mail className="h-3 w-3" /> {t.email}
                                {t.employee_id && (
                                  <span className="ml-2 text-ink-faint">
                                    · Matricule : {t.employee_id}
                                  </span>
                                )}
                              </p>
                              {t.filieres && (
                                <p className="text-caption text-ink-secondary mt-0.5 flex items-center gap-1">
                                  <GraduationCap className="h-3 w-3" />
                                  Filière principale : {t.filieres.name}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Modal d'affectation des matières */}
                            <AssignMatieresModal
                              teacher={{
                                id: t.id,
                                full_name: t.full_name,
                                email: t.email,
                                profile_id: profile?.id || null,
                              }}
                              assignedMatiereIds={assignedMatiereIds}
                              allMatieres={matieres}
                              filieres={filieres}
                            />
                            <DeleteTeacherButton id={t.id} isUsed={t.is_used} />
                          </div>
                        </div>

                        {/* Badges des matières affectées à cet enseignant */}
                        <div className="pl-9">
                          {assignedMatieres.length === 0 ? (
                            <p className="text-caption text-ink-faint italic">
                              Aucune matière encore affectée à cet enseignant.
                            </p>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-caption font-medium text-ink-muted flex items-center gap-1 mr-1">
                                <BookOpen className="h-3 w-3" /> Matières :
                              </span>
                              {assignedMatieres.map((m) => (
                                <span
                                  key={m.id}
                                  className="inline-flex items-center gap-1 rounded bg-canvas-soft px-2 py-0.5 text-caption font-medium text-ink"
                                  title={`${m.name} (${m.niveaux?.name ?? ''})`}
                                >
                                  {m.name}
                                  <span className="text-[10px] text-primary">
                                    ({m.niveaux?.name ?? ''})
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne formulaire d'habilitation */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-title">Habiliter un enseignant</CardTitle>
              <CardDescription>
                Enregistrez l'email officiel pour autoriser la création du compte enseignant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeacherRegistryForm filieres={filieres} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
