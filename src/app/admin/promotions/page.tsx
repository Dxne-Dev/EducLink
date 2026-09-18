import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PromotionForm } from './promotion-form'
import { PromotionRow } from './promotion-row'
import { Building2 } from 'lucide-react'

export const metadata = { title: 'Edulink - Promotions' }

export default async function PromotionAdminPage() {
  const supabase = await createClient()

  const [promotions, filieres, niveaux] = await Promise.all([
    supabase
      .from('promotions')
      .select(`*, filieres(name, code), niveaux(name)`)
      .order('year_start', { ascending: false }),
    supabase.from('filieres').select('id, name'),
    supabase.from('niveaux').select('id, name, filiere_id'),
  ])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Promotions</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Gérez les promotions (années académiques) par filière et niveau.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-title">Liste des promotions</CardTitle>
              <CardDescription>{promotions.data?.length ?? 0} promotion(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {promotions.data && promotions.data.length > 0 ? (
                <ul className="divide-y divide-hairline">
                  {promotions.data.map((p) => (
                    <PromotionRow
                      key={p.id}
                      promotion={p}
                      niveaux={niveaux.data ?? []}
                    />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<Building2 className="h-6 w-6 text-ink-faint" />}
                  title="Aucune promotion"
                  description="Créez votre première promotion avec le formulaire."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-title">Ajouter une promotion</CardTitle>
              <CardDescription>Filière, niveau et année scolaire.</CardDescription>
            </CardHeader>
            <CardContent>
              <PromotionForm
                filieres={filieres.data ?? []}
                niveaux={niveaux.data ?? []}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}