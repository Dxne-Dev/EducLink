'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { RESOURCE_TYPE_LABELS } from '@/lib/constants'
import { parseSearchQuery } from '@/lib/search-parser'
import { formatDate } from '@/lib/utils'
import type { SearchResult, ResourceType } from '@/types/database'
import { Search, FileText, Sparkles, BookOpen, GraduationCap, Building2, User, Download, ExternalLink, Filter } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'

interface Filiere {
  id: string
  name: string
  code?: string
}

const TYPE_STICKER: Record<string, string> = {
  cours: 'bg-accent-purple/20 text-accent-purple-deep dark:bg-purple-900/30 dark:text-purple-300',
  fiche: 'bg-accent-teal/15 text-accent-teal dark:bg-teal-900/30 dark:text-teal-300',
  tp: 'bg-accent-orange/15 text-accent-orange-deep dark:bg-amber-900/30 dark:text-amber-300',
  examen: 'bg-accent-pink/15 text-accent-pink dark:bg-rose-900/30 dark:text-rose-300',
  td: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
}

export default function StudentSearchPage() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<ResourceType | ''>('')
  const [year, setYear] = useState('')
  const [filiere, setFiliere] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [parsed, setParsed] = useState<{ type: ResourceType | null; year: number | null } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('filieres')
      .select('id, name, code')
      .order('name')
      .then(({ data }) => setFilieres(data ?? []))
  }, [])

  async function runSearch() {
    const supabase = createClient()
    setLoading(true)

    const p = parseSearchQuery(query)
    setParsed({ type: p.type, year: p.year })

    const effectiveType = p.type ?? (type as ResourceType | null) ?? null

    const { data, error } = await supabase.rpc('search_resources', {
      p_query: p.query || null,
      p_type: effectiveType,
      p_year: p.year ?? (year ? parseInt(year, 10) : null),
      p_filiere: filiere || null,
      p_limit: 30,
      p_offset: 0,
    })

    if (!error) {
      setResults((data as SearchResult[]) ?? [])
      // Log search
      await supabase.from('search_logs').insert({
        query_text: query,
        filters: { type: effectiveType, year: p.year, filiere: filiere || null },
        result_count: (data as SearchResult[])?.length ?? 0,
      })
    } else {
      setResults([])
    }
    setLoading(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    runSearch()
  }

  const breadcrumb = [
    { label: 'Espace Étudiant', href: '/etudiant/dashboard' },
    { label: 'Recherche Intelligente' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <PageHeader
        breadcrumb={breadcrumb}
        title="Recherche Intelligente de Ressources"
        subtitle="Posez votre requête en langage naturel (ex: « Sujet examen d'algorithmique 2024 ») ou combinez les filtres précis."
      />

      {/* Boîte de recherche principale */}
      <Card className="rounded-3xl border border-hairline bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint dark:text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Que recherchez-vous ? (cours, examen, TP, matière, professeur...)"
                  className="pl-12 h-12 text-body-md rounded-2xl border-hairline bg-canvas-soft/60 focus:bg-white dark:bg-slate-800/60 dark:focus:bg-slate-900"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 px-6 rounded-2xl flex items-center justify-center gap-2 text-body-sm font-semibold shadow-xs"
              >
                <Search className="h-4 w-4" />
                {loading ? 'Recherche...' : 'Rechercher'}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-2 text-caption text-ink-muted dark:text-slate-400 mr-1">
                <Filter className="h-3.5 w-3.5" />
                <span>Filtres :</span>
              </div>

              <Select
                className="w-44 text-caption rounded-xl"
                value={type}
                onChange={(e) => setType(e.target.value as ResourceType | '')}
              >
                <option value="">Tous les types</option>
                {Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>

              <Select
                className="w-52 text-caption rounded-xl"
                value={filiere}
                onChange={(e) => setFiliere(e.target.value)}
              >
                <option value="">Toutes les filières</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.code ? `(${f.code})` : ''}
                  </option>
                ))}
              </Select>

              <Input
                className="w-32 text-caption rounded-xl h-9"
                type="number"
                placeholder="Année (2025)"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </form>

          {parsed && (parsed.type || parsed.year) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-accent-purple/10 dark:bg-purple-950/30 p-3 text-caption text-accent-purple-deep dark:text-purple-300 border border-accent-purple/20">
              <span className="flex items-center gap-1.5 font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Filtres sémantiques détectés :
              </span>
              {parsed.type && (
                <Badge variant="purple" className="px-2 py-0.5">
                  Type : {RESOURCE_TYPE_LABELS[parsed.type]}
                </Badge>
              )}
              {parsed.year && (
                <Badge variant="secondary" className="px-2 py-0.5">
                  Année : {parsed.year}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résultats de la recherche */}
      <div>
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="rounded-3xl border border-hairline p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-16 rounded-lg" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
                <Skeleton className="h-5 w-4/5 rounded-md" />
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-2/3 rounded-md" />
                <div className="border-t border-hairline pt-3 flex justify-between">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-4 w-16 rounded-md" />
                </div>
              </Card>
            ))}
          </div>
        ) : results !== null && results.length === 0 ? (
          <Card className="rounded-3xl border border-hairline bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="py-12">
              <EmptyState
                icon={<Search className="h-8 w-8 text-ink-faint" />}
                title="Aucun document correspondant"
                description="Essayez avec des termes plus généraux, ou ajustez les filtres de type et filière."
              />
            </CardContent>
          </Card>
        ) : results && results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-body-sm font-medium text-ink-muted dark:text-slate-400">
                {results.length} document{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r) => (
                <Card
                  key={r.id}
                  className="flex flex-col justify-between rounded-3xl border border-hairline bg-white shadow-xs transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <CardContent className="p-5 space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
                          TYPE_STICKER[r.type] ?? 'bg-canvas-soft text-ink'
                        }`}
                      >
                        {RESOURCE_TYPE_LABELS[r.type] ?? r.type}
                      </span>
                      {r.rank > 1 && (
                        <span className="text-[10px] font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Pertinence : {Math.round(r.rank * 100)}%
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-ink dark:text-slate-100 text-body-md line-clamp-2" title={r.title}>
                        {r.title}
                      </h3>
                      {r.description && (
                        <p className="mt-1 text-caption text-ink-muted dark:text-slate-400 line-clamp-2">
                          {r.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 rounded-2xl bg-canvas-soft/80 dark:bg-slate-800/60 p-2.5 text-caption border border-hairline dark:border-slate-800">
                      <div className="flex items-center gap-1.5 font-semibold text-ink dark:text-slate-200 truncate">
                        <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{r.matiere_name}</span>
                      </div>
                      <p className="text-[11px] text-ink-faint dark:text-slate-400 truncate">
                        {r.filiere_name} · {r.promo_name}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-hairline dark:border-slate-800 pt-2.5 text-caption text-ink-muted dark:text-slate-400">
                      <span className="flex items-center gap-1 text-[11px] truncate">
                        <User className="h-3 w-3 shrink-0" /> {r.uploader}
                      </span>
                      <span className="text-[11px] font-mono text-ink-faint dark:text-slate-500">
                        {formatDate(r.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
