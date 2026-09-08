import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatFileSize, formatDate } from '@/lib/utils'
import { TEMPLATE_CATEGORIES } from '@/lib/constants'
import { TemplateForm } from './template-form'
import { TemplateDeleteButton } from './template-delete-button'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Edulink - Modèles' }

const CATEGORY_STICKER: Record<string, string> = {
  convention: 'bg-accent-purple/20 text-accent-purple-deep',
  cv_lettre: 'bg-accent-teal/15 text-accent-teal',
  grille: 'bg-accent-orange/15 text-accent-orange-deep',
  autre: 'bg-accent-pink/15 text-accent-pink',
}

export default async function TemplatesPage() {
  const supabase = await createClient()

  const [templates, profile] = await Promise.all([
    supabase.from('templates').select('*, profiles(full_name)').order('created_at', { ascending: false }),
    supabase.from('profiles').select('role'),
  ])

  const data = templates.data ?? []
  const role = profile.data?.[0]?.role
  const canUpload = role === 'admin' || role === 'teacher'

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Modèles & Trames</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Conventions de stage, grilles d'évaluation, CV et lettres types.
        </p>
      </div>

      {canUpload && (
        <Card>
          <CardHeader>
            <CardTitle className="text-title">Ajouter un modèle</CardTitle>
            <CardDescription>Téléversez un nouveau document type.</CardDescription>
          </CardHeader>
          <CardContent>
            <TemplateForm />
          </CardContent>
        </Card>
      )}

      {data.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Aucun modèle disponible"
              description="Les documents types apparaîtront ici."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {TEMPLATE_CATEGORIES.map((cat) => {
            const items = data.filter((t) => t.category === cat.value)
            if (items.length === 0) return null
            return (
              <div key={cat.value}>
                <h2 className="mb-3 text-eyebrow uppercase text-ink-faint">
                  {cat.label}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((t) => (
                    <Card key={t.id} className="transition-shadow hover:shadow-level-1">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className={cn('rounded-md p-2', CATEGORY_STICKER[t.category] ?? 'bg-canvas-soft text-ink-muted')}>
                            <FileText className="h-5 w-5" />
                          </div>
                          {canUpload && <TemplateDeleteButton id={t.id} />}
                        </div>
                        <h3 className="mt-3 text-title font-semibold text-ink">{t.name}</h3>
                        {t.description && (
                          <p className="mt-1 line-clamp-2 text-body-sm text-ink-muted">{t.description}</p>
                        )}
                        <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-caption text-ink-muted">
                          <span>{t.file_size ? formatFileSize(t.file_size) : '—'}</span>
                          <span>{formatDate(t.created_at)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}