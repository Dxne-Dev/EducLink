import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import { FiliereForm } from './filiere-form'
import { DeleteFiliereButton } from './delete-button'
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
      subtitle="Gérez les filières de l'établissement"
      columns={[
        {
          header: 'Nom',
          accessor: 'name'
        },
        {
          header: 'Code',
          accessor: 'code'
        },
        {
          header: 'Description',
          accessor: 'description',
          render: (value) => value ? (
            <span className="line-clamp-1 max-w-xs">{value}</span>
          ) : (
            <span className="text-ink-faint">—</span>
          )
        },
        {
          header: 'Créée le',
          accessor: 'created_at',
          render: (value) => (
            <span className="text-caption text-ink-muted">
              {formatDate(value)}
            </span>
          )
        }
      ]}
      data={filieres ?? []}
      emptyState={{
        title: "Aucune filière",
        description: "Créez votre première filière avec le formulaire."
      }}
      createHref="/admin/filieres"
      createLabel="Nouvelle filière"
      createIcon={<GraduationCap className="mr-2 h-4 w-4" />}
    />
  )
}