import { createClient } from '@/lib/supabase/server'
import { PromotionForm } from './promotion-form'
import { PromotionActions } from './promotion-actions'
import { ListPageShell } from '@/components/admin/ListPageShell'
import { Badge } from '@/components/ui/Badge'

export const metadata = { title: 'Edulink - Promotions' }

export default async function PromotionAdminPage() {
  const supabase = await createClient()

  const [promotionsRes, filieresRes, niveauxRes] = await Promise.all([
    supabase
      .from('promotions')
      .select(`*, filieres(name, code), niveaux(name)`)
      .order('year_start', { ascending: false }),
    supabase.from('filieres').select('id, name').order('name'),
    supabase.from('niveaux').select('id, name, filiere_id').order('sort_order'),
  ])

  const promotions = promotionsRes.data ?? []
  const filieres = filieresRes.data ?? []
  const niveaux = niveauxRes.data ?? []

  const breadcrumb = [
    { label: 'Administration', href: '/admin/dashboard' },
    { label: 'Promotions' },
  ]

  return (
    <ListPageShell
      breadcrumb={breadcrumb}
      title="Promotions"
      subtitle="Gérez les promotions (cohortes académiques) par filière et niveau"
      columns={[
        {
          header: 'Promotion',
          accessor: 'name',
          render: (value, row: any) => (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-orange/15 text-accent-orange-deep dark:bg-amber-900/30 dark:text-amber-300 shadow-sm ring-1 ring-accent-orange/20">
                <span className="iconify text-xl" data-icon="solar:buildings-3-bold-duotone" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink dark:text-slate-100">{value}</span>
                  {row.is_active ? (
                    <Badge variant="success" className="text-[10px] px-1.5 py-0.5">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ),
        },
        {
          header: 'Filière',
          accessor: 'filieres',
          render: (value: any) => (
            <span className="text-body-sm font-medium text-ink-secondary dark:text-slate-300">
              {value?.name ?? '—'}
            </span>
          ),
        },
        {
          header: 'Niveau actuel',
          accessor: 'niveaux',
          render: (value: any) => (
            <Badge variant="secondary" className="font-semibold text-primary">
              {value?.name ?? '—'}
            </Badge>
          ),
        },
        {
          header: 'Année académique',
          accessor: 'year_start',
          render: (_, row: any) => (
            <span className="font-mono text-caption text-ink-muted dark:text-slate-400">
              {row.year_start} – {row.year_end}
            </span>
          ),
        },
      ]}
      data={promotions}
      emptyState={{
        title: 'Aucune promotion',
        description: 'Créez votre première promotion avec le formulaire ci-contre.',
        icon: <span className="iconify text-4xl text-accent-orange-deep" data-icon="solar:buildings-3-bold-duotone" />,
      }}
      formSlot={<PromotionForm filieres={filieres} niveaux={niveaux} />}
      formTitle="Ajouter une promotion"
      formDescription="Associez une filière, un niveau et la période scolaire."
      renderActions={(promo: any) => (
        <PromotionActions promotion={promo} niveaux={niveaux} />
      )}
    />
  )
}