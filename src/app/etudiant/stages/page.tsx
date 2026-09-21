import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatFileSize } from '@/lib/utils'
import {
  Download,
  ExternalLink,
  GraduationCap,
} from 'lucide-react'

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
    case 'gabarit': return 'Gabarit Officiel'
    case 'exemple': return 'Exemple Thématique'
    case 'guide': return 'Guide Méthodologique'
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

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div className="border-b border-hairline pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-heading-2 text-ink">Espace Méthodologie & Stages</h1>
              {filiereInfo && (
                <Badge variant="purple" className="flex items-center gap-1 font-semibold">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {filiereInfo.code || filiereInfo.name}
                </Badge>
              )}
            </div>
            <p className="mt-1.5 text-body-md text-ink-muted">
              Catalogue méthodologique en libre-service : gabarits, exemples et guides adaptés à votre formation.
            </p>
          </div>
        </div>
      </div>

      {allItems.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <EmptyState
              title="Aucun document disponible"
              description="Les gabarits, exemples et guides seront publiés par l'administration."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allItems.map((item) => {
            const isGabarit = item.kind === 'gabarit'
            const isExemple = item.kind === 'exemple'
            const badgeBg = isGabarit ? 'bg-accent-purple/20 text-accent-purple-deep' : isExemple ? 'bg-accent-teal/15 text-accent-teal' : 'bg-accent-orange/15 text-accent-orange-deep'
            const cardBorder = isGabarit ? 'border-accent-purple/30 bg-accent-purple/5' : isExemple ? 'border-accent-teal/30 bg-accent-teal/5' : 'border-accent-orange/30 bg-accent-orange/5'
            const iconBg = isGabarit ? 'bg-accent-purple/20 text-accent-purple-deep' : isExemple ? 'bg-accent-teal/15 text-accent-teal' : 'bg-accent-orange/15 text-accent-orange-deep'
            const linkBg = isGabarit ? 'bg-accent-purple/20 text-accent-purple-deep hover:bg-accent-purple/30' : isExemple ? 'bg-accent-teal/15 text-accent-teal hover:bg-accent-teal/25' : 'bg-accent-orange/15 text-accent-orange-deep hover:bg-accent-orange/25'

            return (
              <Card key={item.id} className={`transition-all hover:shadow-level-1 flex flex-col justify-between ${cardBorder}`}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`grid h-11 w-11 shrink-0 place-content-center rounded-lg ${iconBg} font-semibold`}>
                      {isGabarit ? <Download className="h-5 w-5" /> : isExemple ? <ExternalLink className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeBg}`}>
                          {kindLabel(item.kind)}
                        </span>
                        {item.grade != null && (
                          <Badge variant="success" className="text-[10px] py-0">
                            {item.grade}/20
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-ink text-title truncate mt-1" title={item.name}>{item.name}</h3>
                      {item.company_name && (
                        <p className="text-caption text-ink-muted flex items-center gap-1 mt-1">{item.company_name}</p>
                      )}
                      {item.promo && (
                        <p className="text-caption text-ink-faint flex items-center gap-1 mt-0.5">{item.promo}</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-hairline pt-3 flex items-center justify-between text-caption text-ink-muted">
                    <span>{item.file_size ? formatFileSize(item.file_size) : 'Document'}</span>
                    <span>{formatDate(item.created_at)}</span>
                  </div>

                  {item.signedUrl && (
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={item.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md py-2 px-3 text-caption font-semibold transition-colors ${linkBg}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Consulter
                      </a>
                      <a
                        href={item.signedUrl}
                        download={item.name}
                        className="inline-flex items-center justify-center rounded-md border border-hairline p-2 text-ink-muted hover:text-ink hover:bg-canvas-soft transition-colors"
                        title="Télécharger"
                      >
                        <Download className="h-4 w-4" />
                      </a>
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