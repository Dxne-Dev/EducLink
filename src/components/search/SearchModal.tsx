'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { createClient } from '@/lib/supabase/client'
import { parseSearchQuery } from '@/lib/search-parser'
import { RESOURCE_TYPE_LABELS } from '@/lib/constants'
import { formatFileSize, formatDate } from '@/lib/utils'
import type { SearchResult, ResourceType } from '@/types/database'
import { Kbd } from '@/components/ui/c-input-group-13-utils/kbd'
import {
  Search,
  BookOpen,
  FileText,
  Sparkles,
  User,
  GraduationCap,
  Download,
  ExternalLink,
  X,
  Loader2,
  CornerDownLeft,
  FileCode,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_STYLES: Record<string, string> = {
  cours: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  fiche: 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  tp: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  examen: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  td: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  autre: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
}

interface SearchModalProps {
  userRole?: string
}

export function SearchModal({ userRole = 'student' }: SearchModalProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isMac, setIsMac] = useState(false)
  const [directLoadingId, setDirectLoadingId] = useState<string | null>(null)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsMac(typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent))
  }, [])

  // Global shortcut listener (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [open])

  // Live search effect with debounce
  useEffect(() => {
    if (!open) return

    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const supabase = createClient()
        const parsed = parseSearchQuery(query)
        const effectiveType =
          selectedType !== 'all'
            ? selectedType
            : parsed.type ?? null

        const { data, error } = await supabase.rpc('search_resources', {
          p_query: parsed.query || null,
          p_type: effectiveType,
          p_year: parsed.year ?? null,
          p_limit: 15,
          p_offset: 0,
        })

        if (!error && data) {
          setResults(data as SearchResult[])
          setSelectedIndex(0)
        } else {
          setResults([])
        }
      } catch (err) {
        console.error('Search error:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, selectedType, open])

  // Keyboard navigation inside modal
  const handleKeyDownInList = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelectResource(results[selectedIndex])
    }
  }

  const handleSelectResource = (resource: SearchResult) => {
    setOpen(false)
    if (userRole === 'teacher') {
      router.push(`/prof/mes-cours?matiere=${encodeURIComponent(resource.matiere_name)}`)
    } else if (userRole === 'admin') {
      router.push(`/admin/ressources?search=${encodeURIComponent(resource.title)}`)
    } else {
      router.push(`/etudiant/ressources?resourceId=${resource.id}&matiere=${encodeURIComponent(resource.matiere_name)}`)
    }
  }

  const handleDirectDownloadOrOpen = async (e: React.MouseEvent, resource: SearchResult, download = false) => {
    e.stopPropagation()
    if (!resource.file_path) {
      handleSelectResource(resource)
      return
    }

    try {
      setDirectLoadingId(resource.id)
      const supabase = createClient()
      const extension = resource.file_path.split('.').pop() || 'pdf'
      const safeTitle = (resource.title || 'document').replace(/[/\\?%*:|"<>]/g, '-')
      const fileName = `${safeTitle}.${extension}`

      if (download) {
        // 1. Essai de téléchargement direct du Blob (déclenche immédiatement l'enregistrement du fichier)
        const { data: blob, error: blobError } = await supabase.storage
          .from('resources')
          .download(resource.file_path)

        if (!blobError && blob) {
          const blobUrl = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = blobUrl
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000)
        } else {
          // Fallback : URL signée avec header de téléchargement forcé
          const { data: dlData } = await supabase.storage
            .from('resources')
            .createSignedUrl(resource.file_path, 3600, { download: fileName })
          if (dlData?.signedUrl) {
            window.location.href = dlData.signedUrl
          } else {
            handleSelectResource(resource)
          }
        }
      } else {
        // 2. Consultation : ouverture en mode visualisation dans un nouvel onglet
        const { data } = await supabase.storage
          .from('resources')
          .createSignedUrl(resource.file_path, 3600)
        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank')
        } else {
          handleSelectResource(resource)
        }
      }
    } catch (err) {
      console.error('Download/Open error:', err)
      handleSelectResource(resource)
    } finally {
      setDirectLoadingId(null)
    }
  }

  const parsedQueryInfo = query ? parseSearchQuery(query) : null

  return (
    <>
      {/* Search Bar Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative flex h-10 w-full max-w-[240px] md:max-w-[320px] items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-2 text-sm text-slate-500 shadow-2xs transition-all hover:border-primary/40 hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-primary/50 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
      >
        <span className="flex items-center gap-2 truncate">
          <Search className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
          <span className="truncate text-xs font-normal">Rechercher des cours, examens...</span>
        </span>
        <span className="flex items-center pl-2">
          <Kbd className="border-slate-200 bg-white font-semibold text-slate-500 shadow-2xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </Kbd>
        </span>
      </button>

      {/* Modal Dialog */}
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          
          <DialogPrimitive.Content
            onKeyDown={handleKeyDownInList}
            className="fixed left-1/2 top-[10%] z-50 w-[95vw] max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200 focus:outline-none dark:border-slate-800 dark:bg-slate-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          >
            {/* Search Input Bar */}
            <div className="relative flex items-center border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <Search className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tapez un mot-clé, examen, matière (ex: Examen Algorithmique 2024)..."
                className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0 ml-2" />}
              {query && !loading && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Quick Type Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 bg-slate-50/50 px-4 py-2 text-xs no-scrollbar dark:border-slate-800/80 dark:bg-slate-950/30">
              <span className="text-slate-400 text-[11px] font-medium mr-1 shrink-0">Filtre :</span>
              <button
                type="button"
                onClick={() => setSelectedType('all')}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0 cursor-pointer',
                  selectedType === 'all'
                    ? 'bg-primary text-white font-semibold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                )}
              >
                Tous
              </button>
              {Object.entries(RESOURCE_TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedType(key as ResourceType)}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0 cursor-pointer',
                    selectedType === key
                      ? 'bg-primary text-white font-semibold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Semantic Parsed Badge */}
            {parsedQueryInfo && (parsedQueryInfo.type || parsedQueryInfo.year) && (
              <div className="flex items-center gap-2 bg-primary/5 px-4 py-1.5 text-[11px] text-primary dark:bg-primary/10 border-b border-primary/10">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>Intention détectée :</span>
                {parsedQueryInfo.type && (
                  <span className="font-semibold uppercase tracking-wider">
                    [{RESOURCE_TYPE_LABELS[parsedQueryInfo.type]}]
                  </span>
                )}
                {parsedQueryInfo.year && (
                  <span className="font-semibold">
                    [Année {parsedQueryInfo.year}]
                  </span>
                )}
              </div>
            )}

            {/* Results / Empty / Suggestions */}
            <div className="max-h-[420px] overflow-y-auto p-2">
              {!query.trim() ? (
                <div className="py-8 px-4 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
                    <Search className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Recherchez parmi toutes les ressources pédagogiques
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Exemples : <button type="button" onClick={() => setQuery('DevOps')} className="text-primary hover:underline cursor-pointer">« DevOps »</button>, <button type="button" onClick={() => setQuery('Algorithmique')} className="text-primary hover:underline cursor-pointer">« Algorithmique »</button>, <button type="button" onClick={() => setQuery('Examen 2024')} className="text-primary hover:underline cursor-pointer">« Examen 2024 »</button>
                  </p>
                </div>
              ) : results.length === 0 && !loading ? (
                <div className="py-10 text-center">
                  <FileText className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Aucune ressource trouvée pour « {query} »
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Vérifiez l'orthographe ou essayez un mot-clé plus court.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {results.map((resource, index) => {
                    const isSelected = index === selectedIndex
                    const isDirectLoading = directLoadingId === resource.id
                    return (
                      <li key={resource.id}>
                        <div
                          onClick={() => handleSelectResource(resource)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={cn(
                            'group flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors cursor-pointer',
                            isSelected
                              ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-200'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                          )}
                        >
                          <div className="flex items-start gap-3 min-w-0 pr-2">
                            <div className="mt-0.5 shrink-0">
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
                                  TYPE_STYLES[resource.type] || TYPE_STYLES.autre
                                )}
                              >
                                {RESOURCE_TYPE_LABELS[resource.type] ?? resource.type}
                              </span>
                            </div>

                            <div className="min-w-0">
                              <p className={cn(
                                "text-sm font-semibold truncate",
                                isSelected ? "text-primary dark:text-sky-200" : "text-slate-900 dark:text-slate-100"
                              )}>
                                {resource.title}
                              </p>
                              {resource.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                  {resource.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                                  <BookOpen className="h-3 w-3 text-primary shrink-0" />
                                  {resource.matiere_name}
                                </span>
                                <span>•</span>
                                <span className="truncate">{resource.filiere_name}</span>
                                {resource.file_size && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono">{formatFileSize(resource.file_size)}</span>
                                  </>
                                )}
                                {resource.uploader && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 truncate">
                                      <User className="h-3 w-3" /> {resource.uploader}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 pl-2">
                            {resource.file_path && (
                              <>
                                <button
                                  type="button"
                                  title="Consulter le fichier"
                                  disabled={isDirectLoading}
                                  onClick={(e) => handleDirectDownloadOrOpen(e, resource, false)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs cursor-pointer transition-colors"
                                >
                                  {isDirectLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <ExternalLink className="h-3.5 w-3.5 text-primary" />
                                  )}
                                  <span className="hidden sm:inline">Consulter</span>
                                </button>
                                <button
                                  type="button"
                                  title="Télécharger"
                                  disabled={isDirectLoading}
                                  onClick={(e) => handleDirectDownloadOrOpen(e, resource, true)}
                                  className="inline-flex items-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs cursor-pointer transition-colors"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Footer with shortcuts */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Kbd>↑</Kbd> <Kbd>↓</Kbd>
                  <span className="text-[11px]">Naviguer</span>
                </span>
                <span className="flex items-center gap-1">
                  <Kbd>↵</Kbd>
                  <span className="text-[11px]">Sélectionner</span>
                </span>
                <span className="flex items-center gap-1">
                  <Kbd>Esc</Kbd>
                  <span className="text-[11px]">Fermer</span>
                </span>
              </div>
              <span className="text-[11px] font-medium text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> EduLink Spotlight
              </span>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}
