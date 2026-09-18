'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
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
import { Search, FileText, Sparkles } from 'lucide-react'

interface Filiere { id: string; name: string }

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
    supabase.from('filieres').select('id, name').then(({ data }) => setFilieres(data ?? []))
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Recherche intelligente</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Posez votre question en langage naturel. Ex : « Sujet d'examen d'algorithmique promo 2024 »
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher des cours, examens, fiches..."
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Recherche...' : 'Rechercher'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Select className="w-40" value={type} onChange={(e) => setType(e.target.value as ResourceType | '')}>
                <option value="">Tous les types</option>
                {Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
              <Input
                className="w-32"
                type="number"
                placeholder="Année"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
              <Select className="w-48" value={filiere} onChange={(e) => setFiliere(e.target.value)}>
                <option value="">Toutes les filières</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </Select>
            </div>
          </form>
          {parsed && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-caption text-ink-muted">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Filtres détectés :
              </span>
              {parsed.type && <Badge variant="default">{RESOURCE_TYPE_LABELS[parsed.type]}</Badge>}
              {parsed.year && <Badge variant="default">Promo {parsed.year}</Badge>}
              {!parsed.type && !parsed.year && (
                <span className="text-caption text-ink-faint">aucun — recherche plein texte</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-2/3" /><Skeleton className="mt-3 h-3 w-full" /><Skeleton className="mt-2 h-3 w-4/5" /></CardContent></Card>
            ))}
          </div>
        ) : results !== null && results.length === 0 ? (
          <Card><CardContent><EmptyState title="Aucun résultat" description="Essayez une autre requête ou élargissez les filtres." /></CardContent></Card>
        ) : results && results.length > 0 ? (
          <>
            <p className="mb-3 text-body-sm text-ink-muted">{results.length} résultat(s)</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r) => (
                <Card key={r.id} className="transition-shadow hover:shadow-level-1">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="rounded-md bg-accent-purple/20 p-2 text-accent-purple-deep">
                        <FileText className="h-4 w-4" />
                      </div>
                      <Badge variant="default">{RESOURCE_TYPE_LABELS[r.type]}</Badge>
                    </div>
                    <h3 className="mt-3 text-title font-semibold text-ink">{r.title}</h3>
                    {r.description && (
                      <p className="mt-1 line-clamp-2 text-body-sm text-ink-muted">{r.description}</p>
                    )}
                    <div className="mt-3 space-y-1 text-caption text-ink-muted">
                      <p>{r.filiere_name} · {r.matiere_name} · {r.promo_name}</p>
                      <p>par {r.uploader}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-caption text-ink-muted">
                      <span>{formatDate(r.created_at)}</span>
                      {r.rank > 1 && <span>pertinence {r.rank.toFixed(2)}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
