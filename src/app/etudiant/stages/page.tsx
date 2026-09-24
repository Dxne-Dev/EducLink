import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatDate, formatFileSize } from '@/lib/utils'
import {
  Download,
  ExternalLink,
  GraduationCap,
  FileText,
  Building,
  Award,
  BookOpen,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Icon } from '@/components/ui/Icon'

export const metadata = { title: 'Edulink — Espace Stage & Méthodologie' }

type DocKind = 'gabarit' | 'exemple' | 'guide'

interface DocItem {
  id: string
  kind: DocKind
  name: string
  description: string | null
  file_path: string | null
  file_size: number | null
  created_at: string
  signedUrl: string | null
  subject?: string | null
  company_name?: string | null
  grade?: number | null
  promo?: string | null
}

function classifyKind(t: any): DocKind {
  const cat = t.category || ''
  const name = (t.name || '').toLowerCase()
  if (cat === 'gabarit' || name.includes('gabarit') || name.includes('latex') || name.includes('word')) return 'gabarit'
  if (cat === 'exemple') return 'exemple'
  return 'guide'
}

function kindLabel(k: DocKind) {
  switch (k) {
    case 'gabarit':
      return 'Gabarit Officiel'
    case 'exemple':
      return 'Exemple Thématique'
    case 'guide':
      return 'Guide Méthodologique'
  }
}

export default async function StudentStagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      filiere_id,
      niveau_id,
      role,
      full_name,
      filieres(id, name, code)
    `)
    .eq('id', user.id)
    .single()

  const rawFiliere = profile?.filieres as unknown
  const filiereInfo = (Array.isArray(rawFiliere) ? rawFiliere[0] : rawFiliere) as { id: string; name: string; code: string } | null
  const studentFiliereId = filiereInfo?.id || profile?.filiere_id

  let templatesQuery = supabase
    .from('templates')
    .select('id, name, description, category, file_path, file_size, created_at, filiere_id')
    .order('created_at', { ascending: false })

  if (studentFiliereId) {
    templatesQuery = templatesQuery.or(`filiere_id.is.null,filiere_id.eq.${studentFiliereId}`)
  }

  let reportsQuery = supabase
    .from('internship_reports')
    .select(`
      id,
      file_path,
      file_size,
      validated_at,
      internships (
        subject,
        company_name,
        grade,
        profiles (full_name, filiere_id),
        promotions (name)
      )
    `)
    .eq('is_validated', true)
    .order('validated_at', { ascending: false })

  const [templatesRes, reportsRes] = await Promise.all([templatesQuery, reportsQuery])

  let rawReports = reportsRes.data ?? []
  if (studentFiliereId && rawReports.length > 0) {
    const filiereReports = rawReports.filter(
      (r: any) => (r.internships?.profiles as any)?.filiere_id === studentFiliereId
    )
    if (filiereReports.length > 0) rawReports = filiereReports
  }

  const allTemplates = await Promise.all(
    (templatesRes.data ?? []).map(async (t) => {
      let signedUrl: string | null = null
      if (t.file_path) {
        const { data: sd } = await supabase.storage.from('templates').createSignedUrl(t.file_path, 3600)
        signedUrl = sd?.signedUrl || null
      }
      return { ...t, signedUrl }
    })
  )

  const validatedReports = await Promise.all(
    rawReports.map(async (r: any) => {
      let signedUrl: string | null = null
      if (r.file_path) {
        const { data: sd } = await supabase.storage.from('internships').createSignedUrl(r.file_path, 3600)
        signedUrl = sd?.signedUrl || null
      }
      return { ...r, signedUrl }
    })
  )

  const allItems: DocItem[] = [
    ...allTemplates.map((t) => ({
      id: t.id,
      kind: classifyKind(t),
      name: t.name,
      description: t.description,
      file_path: t.file_path,
      file_size: t.file_size,
      created_at: t.created_at,
      signedUrl: t.signedUrl,
    })),
    ...validatedReports.map((r: any) => ({
      id: r.id,
      kind: 'exemple' as DocKind,
      name: r.internships?.subject || 'Rapport de stage',
      description: null,
      file_path: r.file_path,
      file_size: r.file_size,
      created_at: r.created_at || r.validated_at,
      signedUrl: r.signedUrl,
      subject: r.internships?.subject,
      company_name: r.internships?.company_name,
      grade: r.internships?.grade,
      promo: r.internships?.promotions?.name,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const breadcrumb = [
    { label: 'Espace Étudiant', href: '/etudiant/dashboard' },
    { label: 'Stages & Gabarits' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <PageHeader
        breadcrumb={breadcrumb}
        title="Espace Stages & Méthodologie"
        subtitle={
          filiereInfo
            ? `Gabarits Word/LaTeX officiels, guides et rapports validés pour la filière ${filiereInfo.name}.`
            : 'Catalogue méthodologique en libre-service pour vos rapports de stage et mémoires.'
        }
      />

      {allItems.length === 0 ? (
        <Card className="rounded-3xl border border-hairline bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="py-12">
            <EmptyState
              icon={<Icon name="solar:document-medicine-bold-duotone" className="text-4xl text-accent-orange-deep" />}
              title="Aucun document disponible"
              description="Les gabarits, exemples et guides seront publiés par l'administration."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {allItems.map((item) => {
            const isGabarit = item.kind === 'gabarit'
            const isExemple = item.kind === 'exemple'

            const badgeBg = isGabarit
              ? 'bg-accent-purple/15 text-accent-purple-deep dark:bg-purple-900/40 dark:text-purple-300'
              : isExemple
              ? 'bg-accent-teal/15 text-accent-teal dark:bg-teal-900/40 dark:text-teal-300'
              : 'bg-accent-orange/15 text-accent-orange-deep dark:bg-amber-900/30 dark:text-amber-300'

            const iconBg = isGabarit
              ? 'bg-accent-purple/15 text-accent-purple-deep dark:bg-purple-900/30 dark:text-purple-300 shadow-sm ring-1 ring-accent-purple/20'
              : isExemple
              ? 'bg-accent-teal/15 text-accent-teal dark:bg-teal-900/30 dark:text-teal-300 shadow-sm ring-1 ring-accent-teal/20'
              : 'bg-accent-orange/15 text-accent-orange-deep dark:bg-amber-900/30 dark:text-amber-300 shadow-sm ring-1 ring-accent-orange/20'

            return (
              <Card
                key={item.id}
                className="flex flex-col justify-between rounded-3xl border border-hairline bg-white shadow-xs transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <CardContent className="p-5 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
                      {isGabarit ? (
                        <Icon name="solar:code-file-bold-duotone" className="text-2xl" />
                      ) : isExemple ? (
                        <Icon name="solar:diploma-verified-bold-duotone" className="text-2xl" />
                      ) : (
                        <Icon name="solar:compass-bold-duotone" className="text-2xl" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeBg}`}>
                          {kindLabel(item.kind)}
                        </span>
                        {item.grade != null && (
                          <Badge variant="success" className="text-[10px] py-0 px-1.5 font-bold">
                            {item.grade}/20
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-ink dark:text-slate-100 text-body-md line-clamp-2 mt-1.5" title={item.name}>
                        {item.name}
                      </h3>
                      {item.company_name && (
                        <p className="text-caption text-ink-muted dark:text-slate-400 flex items-center gap-1 mt-1 truncate">
                          <Building className="h-3 w-3 shrink-0" />
                          {item.company_name}
                        </p>
                      )}
                      {item.promo && (
                        <p className="text-[11px] text-ink-faint dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          {item.promo}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-hairline dark:border-slate-800 pt-2.5 text-caption text-ink-muted dark:text-slate-400 font-mono">
                    <span>{item.file_size ? formatFileSize(item.file_size) : 'Document'}</span>
                    <span>{formatDate(item.created_at)}</span>
                  </div>

                  {item.signedUrl && (
                    <div className="flex items-center gap-2 pt-2 border-t border-hairline dark:border-slate-800">
                      <a
                        href={item.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 dark:bg-primary/20 py-2 px-3 text-caption font-semibold text-primary dark:text-sky-300 hover:bg-primary/20 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Consulter
                      </a>
                      <Tooltip content="Télécharger le fichier">
                        <a
                          href={item.signedUrl}
                          download={item.name}
                          className="inline-flex items-center justify-center rounded-xl border border-hairline dark:border-slate-700 p-2 text-ink-muted hover:text-ink hover:bg-canvas-soft dark:hover:bg-slate-800 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </Tooltip>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}