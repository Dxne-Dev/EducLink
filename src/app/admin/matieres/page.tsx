import { createClient } from '@/lib/supabase/server'
import { Icon } from '@iconify/react'
import { NiveauForm } from './niveau-form'
import { MatiereForm } from './matiere-form'
import { DeleteButton } from './delete-button'
import { EditMatiereModal } from './edit-matiere-modal'
import { ListPageShell } from '@/components/admin/ListPageShell'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

export const metadata = { title: 'Edulink - Matières & Niveaux' }

export default async function MatiereAdminPage() {
  const supabase = await createClient()

  const [filieresRes, niveauxRes, matieresRes] = await Promise.all([
    supabase.from('filieres').select('id, name, code').order('name'),
    supabase.from('niveaux').select('id, name, filiere_id').order('sort_order'),
    supabase
      .from('matieres')
      .select('id, name, code, niveau_id, created_at')
      .order('name'),
  ])

  const filieresList = filieresRes.data ?? []
  const niveauxList = niveauxRes.data ?? []
  const matieresList = matieresRes.data ?? []

  const filiereMap = new Map(filieresList.map((f) => [f.id, f.name]))
  const niveauMap = new Map(niveauxList.map((n) => [n.id, n]))

  const processedMatieres = matieresList.map((m) => {
    const niveauObj = niveauMap.get(m.niveau_id)
    const niveauName = niveauObj ? niveauObj.name : 'Inconnu'
    const filiereName =
      niveauObj && niveauObj.filiere_id
        ? filiereMap.get(niveauObj.filiere_id) ?? 'Inconnu'
        : 'Inconnu'

    return {
      ...m,
      niveauName,
      filiereName,
    }
  })

  const breadcrumb = [
    { label: 'Administration', href: '/admin/dashboard' },
    { label: 'Matières & Niveaux' },
  ]

  const rightFormSlot = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon icon="solar:layers-minimalistic-bold-duotone" height={16} />
          </div>
          <h3 className="text-body-sm font-semibold text-ink dark:text-slate-100">
            1. Ajouter un niveau
          </h3>
        </div>
        <NiveauForm filieres={filieresList} />
      </div>

      <div className="border-t border-hairline dark:border-slate-800 pt-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Icon icon="solar:book-bookmark-bold-duotone" height={16} />
          </div>
          <h3 className="text-body-sm font-semibold text-ink dark:text-slate-100">
            2. Ajouter des matières
          </h3>
        </div>
        <MatiereForm filieres={filieresList} niveaux={niveauxList} />
      </div>
    </div>
  )

  return (
    <ListPageShell
      breadcrumb={breadcrumb}
      title="Matières"
      subtitle="Organisez et associez les matières aux niveaux et filières académiques"
      columns={[
        {
          header: 'Matière',
          accessor: 'name',
          render: (value) => (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-600 dark:bg-teal-500/25 dark:text-teal-400">
                <Icon icon="solar:book-bookmark-bold-duotone" height={22} />
              </div>
              <span className="font-semibold text-ink dark:text-slate-100">{value}</span>
            </div>
          ),
        },
        {
          header: 'Code',
          accessor: 'code',
          className: 'w-24',
          render: (value) =>
            value ? (
              <span className="inline-flex rounded-lg bg-canvas-soft dark:bg-slate-800 px-2 py-0.5 font-mono text-caption font-semibold text-ink-secondary dark:text-slate-300">
                {value}
              </span>
            ) : (
              <span className="text-ink-faint">—</span>
            ),
        },
        {
          header: 'Niveau',
          accessor: 'niveauName',
          className: 'w-28',
          render: (value) => (
            <Badge variant="secondary" className="font-semibold text-primary">
              {value}
            </Badge>
          ),
        },
        {
          header: 'Filière',
          accessor: 'filiereName',
          className: 'w-36',
          render: (value) => (
            <span className="text-caption font-medium text-ink-muted dark:text-slate-400">
              {value}
            </span>
          ),
        },
        {
          header: 'Créée le',
          accessor: 'created_at',
          className: 'w-28',
          render: (value) => (
            <span className="text-caption text-ink-muted dark:text-slate-400">
              {formatDate(value)}
            </span>
          ),
        },
      ]}
      data={processedMatieres}
      emptyState={{
        title: 'Aucune matière',
        description: 'Créez vos niveaux puis ajoutez vos matières avec le formulaire ci-contre.',
        icon: <Icon icon="solar:book-bookmark-bold-duotone" height={32} />,
      }}
      formSlot={rightFormSlot}
      formTitle="Structure académique"
      formDescription="Créez vos niveaux par filière puis associez-y vos matières."
      renderActions={(matiere) => (
        <div className="flex items-center gap-1">
          <EditMatiereModal
            matiere={matiere}
            niveaux={niveauxList}
            filieres={filieresList}
          />
          <DeleteButton type="matiere" id={matiere.id} />
        </div>
      )}
    />
  )
}