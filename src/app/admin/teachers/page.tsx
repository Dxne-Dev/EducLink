import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { TeacherRegistryForm } from './registry/teacher-registry-form'
import { DeleteTeacherButton } from './registry/delete-teacher-button'
import { AssignMatieresModal } from './assign-matieres-modal'
import { Award, Mail, CheckCircle2, Clock, BookOpen, GraduationCap } from 'lucide-react'
import { ListPageShell } from '@/components/admin/ListPageShell'

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

  const breadcrumb = [
    { label: 'Administration', href: '/admin/dashboard' },
    { label: 'Enseignants & Matières' },
  ]

  return (
    <ListPageShell
      breadcrumb={breadcrumb}
      title="Corps Enseignant"
      subtitle="Habilitez les enseignants officiels et associez-les aux matières qu'ils dispensent pour chaque niveau"
      columns={[
        {
          header: 'Enseignant',
          accessor: 'full_name',
          render: (value, t: any) => {
            const profile = teacherProfiles.find(
              (p: any) =>
                (p.email && t.email && p.email.toLowerCase() === t.email.toLowerCase()) ||
                p.full_name?.toLowerCase() === t.full_name?.toLowerCase()
            )
            const isActivated = Boolean(t.is_used || profile)
            const initial = (value || 'E').charAt(0).toUpperCase()

            return (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-orange/15 text-accent-orange-deep dark:bg-amber-900/30 dark:text-amber-300 shadow-sm ring-1 ring-accent-orange/20">
                  <span className="iconify text-xl" data-icon="solar:user-check-bold-duotone" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink dark:text-slate-100">{t.full_name}</p>
                    {isActivated ? (
                      <Badge variant="success" className="text-[10px] px-1.5 py-0.5">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Activé
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px] px-1.5 py-0.5">
                        <Clock className="h-3 w-3 mr-1" /> En attente
                      </Badge>
                    )}
                  </div>
                  <p className="text-caption text-ink-muted dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3" /> {t.email}
                    {t.employee_id && (
                      <span className="ml-1 text-ink-faint">
                        · Matr. {t.employee_id}
                      </span>
                    )}
                  </p>
                  {t.filieres && (
                    <p className="text-caption text-ink-secondary dark:text-slate-300 mt-0.5 flex items-center gap-1">
                      <GraduationCap className="h-3 w-3 text-accent-purple-deep" />
                      Filière : {t.filieres.name}
                    </p>
                  )}
                </div>
              </div>
            )
          },
        },
        {
          header: 'Matières dispensées',
          className: 'min-w-[200px]',
          render: (_, t: any) => {
            const profile = teacherProfiles.find(
              (p: any) =>
                (p.email && t.email && p.email.toLowerCase() === t.email.toLowerCase()) ||
                p.full_name?.toLowerCase() === t.full_name?.toLowerCase()
            )
            const assigned = teacherMatieres.filter(
              (tm: any) =>
                tm.teacher_registry_id === t.id ||
                (profile && tm.teacher_id === profile.id)
            )
            const assignedMatiereIds = assigned.map((tm: any) => tm.matiere_id)
            const assignedMatieres = matieres.filter((m) =>
              assignedMatiereIds.includes(m.id)
            )

            if (assignedMatieres.length === 0) {
              return (
                <span className="text-caption text-ink-faint italic">
                  Aucune matière affectée
                </span>
              )
            }

            return (
              <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
                {assignedMatieres.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 rounded-md bg-canvas-soft dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-ink dark:text-slate-200 border border-hairline dark:border-slate-700"
                    title={`${m.name} (${m.niveaux?.name ?? ''})`}
                  >
                    <span>{m.name}</span>
                    {m.niveaux?.name && (
                      <span className="text-[9px] font-semibold text-primary">
                        ({m.niveaux.name})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )
          },
        },
      ]}
      data={teachers}
      emptyState={{
        title: 'Aucun enseignant habilité',
        description:
          'Ajoutez des enseignants via le formulaire ci-contre pour autoriser leur inscription et leur affecter des matières.',
        icon: <span className="iconify text-4xl text-accent-orange-deep" data-icon="solar:user-check-bold-duotone" />,
      }}
      formSlot={<TeacherRegistryForm filieres={filieres} />}
      formTitle="Habiliter un enseignant"
      formDescription="Enregistrez l'email officiel pour autoriser la création du compte enseignant."
      renderActions={(t: any) => {
        const profile = teacherProfiles.find(
          (p: any) =>
            (p.email && t.email && p.email.toLowerCase() === t.email.toLowerCase()) ||
            p.full_name?.toLowerCase() === t.full_name?.toLowerCase()
        )
        const assigned = teacherMatieres.filter(
          (tm: any) =>
            tm.teacher_registry_id === t.id ||
            (profile && tm.teacher_id === profile.id)
        )
        const assignedMatiereIds = assigned.map((tm: any) => tm.matiere_id)

        return (
          <div className="flex items-center gap-1.5">
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
        )
      }}
    />
  )
}
