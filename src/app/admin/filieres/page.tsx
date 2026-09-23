import { createClient } from '@/lib/supabase/server'
import { Icon } from '@iconify/react'
import { FiliereForm } from './filiere-form'
import { DeleteFiliereButton } from './delete-button'
import { EditFiliereModal } from './edit-filiere-modal'
import { ListPageShell } from '@/components/admin/ListPageShell'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Edulink - Filières' }

export default async function FiliereAdminPage() {
  const supabase = await createClient()
  const { data: filieres } = await supabase
    .from('filieres')
    .select('*')
    .order('name')

  const breadcrumb = [
    { label: 'Administration', href: '/admin/dashboard' },
    { label: 'Filières' }
  ]

  return (
    <ListPageShell
      breadcrumb={breadcrumb}
      title="Filières"
      subtitle="Gérez les filières et cursus de l'établissement"
      columns={[
        {
          header: 'Filière',
          accessor: 'name',
          render: (value, row) => (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-300">
                <Icon icon="solar:diploma-verified-bold-duotone" height={22} />
              </div>
              <div>
                <span className="font-semibold text-ink dark:text-slate-100">{value}</span>
                {row.description && (
                  <p className="text-caption text-ink-muted dark:text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                    {row.description}
                  </p>
                )}
              </div>
            </div>
          )
        },
        {
          header: 'Code',
          accessor: 'code',
          className: 'w-24',
          render: (value) => (
            <span className="inline-flex rounded-lg bg-canvas-soft dark:bg-slate-800 px-2.5 py-1 font-mono text-caption font-semibold text-primary">
              {value}
            </span>
          )
        },
        {
          header: 'Créée le',
          accessor: 'created_at',
          className: 'w-32',
          render: (value) => (
            <span className="text-caption text-ink-muted dark:text-slate-400">
              {formatDate(value)}
            </span>
          )
        }
      ]}
      data={filieres ?? []}
      emptyState={{
        title: 'Aucune filière',
        description: 'Créez votre première filière avec le formulaire ci-contre.',
        icon: <Icon icon="solar:diploma-bold-duotone" height={32} />
      }}
      formSlot={<FiliereForm />}
      formTitle="Ajouter une filière"
      formDescription="Définissez le nom, code court et description du cursus."
      renderActions={(filiere) => (
        <div className="flex items-center gap-1">
          <EditFiliereModal filiere={filiere} />
          <DeleteFiliereButton id={filiere.id} />
        </div>
      )}
    />
  )
}