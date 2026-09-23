import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import { NiveauForm } from './niveau-form'
import { MatiereForm } from './matiere-form'
import { DeleteButton } from './delete-button'
import { ListPageShell } from '@/components/admin/ListPageShell'
import type { PageHeaderCrumb } from '@/components/layout/PageHeader'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Edulink - Matières' }

export default async function MatiereAdminPage() {
  const supabase = await createClient()

  // Fetch all needed data for lookups
  const [filieresRes, niveauxRes, matieresRes] = await Promise.all([
    supabase.from('filieres').select('id, name').order('name'),
    supabase.from('niveaux').select('id, name, filiere_id').order('sort_order'),
    supabase.from('matieres').select('id, name, code, niveau_id, created_at').order('name'),
  ])

  const filieresList = filieresRes.data ?? []
  const niveauxList = niveauxRes.data ?? []
  const matieresList = matieresRes.data ?? []

  // Create lookup maps for efficient access
  const filiereMap = new Map(filieresList.map(f => [f.id, f.name]))
  const niveauMap = new Map(niveauxList.map(n => [n.id, n.name]))

  // Process matieres data to include filiere and niveau names for display
  const processedMatieres = matieresList.map(m => {
    const niveauObj = niveauxList.find(n => n.id === m.niveau_id);
    const niveauName = niveauObj ? niveauObj.name : 'Inconnu';

    const filiereName = niveauObj && niveauObj.filiere_id ?
      filiereMap.get(niveauObj.filiere_id) : 'Inconnu';

    return {
      ...m,
      niveauName,
      filiereName
    };
  });

  const breadcrumb: PageHeaderCrumb[] = [
    { label: 'Administration', href: '/admin/dashboard' },
    { label: 'Matières' }
  ]

  return (
    <ListPageShell
      breadcrumb={breadcrumb}
      title="Matières"
      subtitle="Organisez les matières par niveau et filière"
      columns={[
        {
          header: 'Nom',
          accessor: 'name'
        },
        {
          header: 'Code',
          accessor: 'code',
          render: (value) => value ? (
            <span className="font-mono text-ink">{value}</span>
          ) : (
            <span className="text-ink-faint">—</span>
          )
        },
        {
          header: 'Niveau',
          accessor: 'niveauName'
        },
        {
          header: 'Filière',
          accessor: 'filiereName'
        },
        {
          header: 'Créée le',
          accessor: 'created_at',
          render: (value) => (
            <span className="text-caption text-ink-muted">
              {formatDate(value as string)}
            </span>
          )
        }
      ]}
      data={processedMatieres}
      emptyState={{
        title: "Aucune matière",
        description: "Créez votre première matière avec le formulaire ci-dessous."
      }}
      createHref="/admin/matieres"
      createLabel="Nouvelle matière"
      createIcon={<GraduationCap className="mr-2 h-4 w-4" />}
    />
  )
}