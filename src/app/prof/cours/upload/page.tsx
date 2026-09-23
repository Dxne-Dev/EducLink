'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { toast } from '@/components/ui/Toast'
import { RESOURCE_TYPE_LABELS, ALLOWED_RESOURCE_TYPES } from '@/lib/constants'
import { createResourceMeta } from '@/lib/actions/resources.actions'
import {
  UploadCloud,
  CheckCircle2,
  FileText,
  GraduationCap,
  Layers,
  BookOpen,
  Building2,
  Globe,
  Lock,
  Calendar,
  Sparkles,
  ArrowLeft,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import type { ResourceVisibility } from '@/types/database'

export default function ProfUploadResourcePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadDone, setUploadDone] = useState(false)

  const [filieres, setFilieres] = useState<{ id: string; name: string; code: string }[]>([])
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [niveaux, setNiveaux] = useState<{ id: string; name: string }[]>([])
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [matieres, setMatieres] = useState<{ id: string; name: string }[]>([])
  const [selectedMatiere, setSelectedMatiere] = useState('')
  const [promotions, setPromotions] = useState<{ id: string; name: string }[]>([])
  const [selectedPromo, setSelectedPromo] = useState('')
  const [loadingData, setLoadingData] = useState(true)
  const [myMatiereIds, setMyMatiereIds] = useState<string[] | null>(null)
  const [myFiliereIds, setMyFiliereIds] = useState<string[] | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const supabase = createClient()

  // 0. Charger les matières assignées à cet enseignant
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      const { data: reg } = await supabase
        .from('teacher_registry')
        .select('id')
        .ilike('email', user.email || '')
        .maybeSingle()

      let tmQuery = supabase.from('teacher_matieres').select('matiere_id')
      if (reg?.id) {
        tmQuery = tmQuery.or(`teacher_id.eq.${user.id},teacher_registry_id.eq.${reg.id}`)
      } else {
        tmQuery = tmQuery.eq('teacher_id', user.id)
      }

      const { data: tmRows } = await tmQuery
      if (tmRows && tmRows.length > 0) {
        const ids = tmRows.map((r: any) => r.matiere_id)
        setMyMatiereIds(ids)
        const { data: matRows } = await supabase
          .from('matieres')
          .select('niveau_id, niveaux(filiere_id)')
          .in('id', ids)
        const fIds = [
          ...new Set(
            matRows?.flatMap((r: any) => (r.niveaux ? [r.niveaux.filiere_id] : [])).filter(Boolean) ?? []
          ),
        ]
        setMyFiliereIds(fIds)
      } else {
        setMyMatiereIds([])
        setMyFiliereIds([])
      }
    })
  }, [])

  // 1. Charger les filières
  useEffect(() => {
    supabase
      .from('filieres')
      .select('id, name, code')
      .order('name')
      .then(({ data }) => {
        setFilieres(data ?? [])
        setLoadingData(false)
      })
  }, [])

  // 2. Quand la filière change : charger niveaux + promotions
  useEffect(() => {
    if (!selectedFiliere) {
      setNiveaux([])
      setSelectedNiveau('')
      setMatieres([])
      setSelectedMatiere('')
      setPromotions([])
      setSelectedPromo('')
      return
    }

    Promise.all([
      supabase
        .from('niveaux')
        .select('id, name')
        .eq('filiere_id', selectedFiliere)
        .order('sort_order'),
      supabase
        .from('promotions')
        .select('id, name')
        .eq('filiere_id', selectedFiliere)
        .order('year_start', { ascending: false }),
    ]).then(([niveauxRes, promosRes]) => {
      setNiveaux(niveauxRes.data ?? [])
      setSelectedNiveau('')
      setMatieres([])
      setSelectedMatiere('')
      setPromotions(promosRes.data ?? [])
      setSelectedPromo('')
    })
  }, [selectedFiliere])

  // 3. Quand le niveau change : charger les matières (filtrées pour l'enseignant)
  useEffect(() => {
    if (!selectedNiveau) {
      setMatieres([])
      setSelectedMatiere('')
      return
    }

    supabase
      .from('matieres')
      .select('id, name')
      .eq('niveau_id', selectedNiveau)
      .order('name')
      .then(({ data }) => {
        let allMatieres = data ?? []
        if (myMatiereIds && myMatiereIds.length > 0) {
          allMatieres = allMatieres.filter((m) => myMatiereIds.includes(m.id))
        }
        setMatieres(allMatieres)
        setSelectedMatiere('')
      })
  }, [selectedNiveau, myMatiereIds])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setUploadProgress(null)
    setUploadDone(false)

    const form = e.currentTarget
    const file = selectedFile

    if (!file) {
      setError('Veuillez sélectionner un fichier')
      setLoading(false)
      return
    }

    if (!ALLOWED_RESOURCE_TYPES.includes(file.type as any)) {
      setError('Type de fichier non autorisé. Utilisez PDF, DOCX, PPTX ou ZIP.')
      setLoading(false)
      return
    }

    // ── Étape 1 : upload direct navigateur → Supabase Storage ─────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Session expirée. Veuillez vous reconnecter.')
      setLoading(false)
      return
    }

    const ext = file.name.split('.').pop()
    const filePath = `${user.id}/${Date.now()}.${ext}`

    setUploadProgress(0)

    const { signedUrl } = await getUploadSignedUrl(user.id, filePath, file.type)
    let finalFilePath = filePath

    if (signedUrl) {
      const uploaded = await uploadWithProgress(signedUrl, file, (pct) => {
        setUploadProgress(pct)
      })
      if (!uploaded.ok) {
        setError(`Erreur lors de l'upload : ${uploaded.error}`)
        setLoading(false)
        setUploadProgress(null)
        return
      }
    } else {
      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, file)

      if (uploadError) {
        setError(`Erreur lors de l'upload : ${uploadError.message}`)
        setLoading(false)
        setUploadProgress(null)
        return
      }
    }

    setUploadProgress(100)
    setUploadDone(true)

    // ── Étape 2 : enregistrement des métadonnées en base (server action) ──
    const visibility = ((form.elements.namedItem('visibility') as HTMLSelectElement)?.value as ResourceVisibility) ?? 'private'
    const title = (form.elements.namedItem('title') as HTMLInputElement)?.value ?? ''
    const description = (form.elements.namedItem('description') as HTMLTextAreaElement)?.value ?? ''
    const type = (form.elements.namedItem('type') as HTMLSelectElement)?.value as any
    const annee_scolaire = (form.elements.namedItem('annee_scolaire') as HTMLInputElement)?.value || null

    const res = await createResourceMeta({
      title,
      description: description || undefined,
      type,
      matiere_id: selectedMatiere,
      promo_id: selectedPromo,
      visibility,
      annee_scolaire,
      file_path: finalFilePath,
      file_size: file.size,
      mime_type: file.type,
    })

    if (res?.error) {
      setError(res.error)
      toast.error(res.error)
      setLoading(false)
      return
    }

    toast.success('Document pédagogique publié avec succès !')
    router.push('/prof/mes-cours')
    router.refresh()
  }

  const breadcrumb = [
    { label: 'Espace Enseignant', href: '/prof/mes-cours' },
    { label: 'Ma Bibliothèque', href: '/prof/mes-cours' },
    { label: 'Publier un cours' },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <PageHeader
        breadcrumb={breadcrumb}
        title="Publier un document pédagogique"
        subtitle="Déposez un cours, TP, TD, examen ou fiche pour vos étudiants et promotions assignées."
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1 : Cursus & Destination Académique */}
        <Card className="rounded-3xl border border-hairline bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-purple/15 text-accent-purple-deep dark:bg-purple-900/30 dark:text-purple-300">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-title text-ink dark:text-slate-100">
                  1. Destination Académique
                </CardTitle>
                <CardDescription className="text-caption text-ink-muted dark:text-slate-400">
                  Sélectionnez la filière, le niveau et la promotion ciblée par ce document.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="filiere_select">Filière *</Label>
                <Select
                  id="filiere_select"
                  value={selectedFiliere}
                  onChange={(e) => setSelectedFiliere(e.target.value)}
                  required
                  className="mt-1"
                >
                  <option value="" disabled>
                    {loadingData ? 'Chargement des filières...' : 'Sélectionner une filière'}
                  </option>
                  {filieres
                    .filter((f) => !myFiliereIds || myFiliereIds.includes(f.id))
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="niveau_select">Niveau d'études *</Label>
                <Select
                  id="niveau_select"
                  value={selectedNiveau}
                  onChange={(e) => setSelectedNiveau(e.target.value)}
                  disabled={!selectedFiliere}
                  required
                  className="mt-1"
                >
                  <option value="" disabled>
                    {!selectedFiliere
                      ? "Choisissez d'abord une filière"
                      : niveaux.length === 0
                      ? 'Aucun niveau configuré'
                      : 'Sélectionner le niveau'}
                  </option>
                  {niveaux.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="matiere_id">Matière / Module *</Label>
                <Select
                  id="matiere_id"
                  name="matiere_id"
                  value={selectedMatiere}
                  onChange={(e) => setSelectedMatiere(e.target.value)}
                  disabled={!selectedNiveau}
                  required
                  className="mt-1"
                >
                  <option value="" disabled hidden>
                    {!selectedNiveau
                      ? "Choisissez d'abord un niveau"
                      : matieres.length === 0
                      ? 'Aucune matière assignée'
                      : 'Sélectionner la matière'}
                  </option>
                  {matieres.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="promo_id">Promotion principale *</Label>
                <Select
                  id="promo_id"
                  name="promo_id"
                  value={selectedPromo}
                  onChange={(e) => setSelectedPromo(e.target.value)}
                  disabled={!selectedFiliere}
                  required
                  className="mt-1"
                >
                  <option value="" disabled hidden>
                    {!selectedFiliere
                      ? "Choisissez d'abord une filière"
                      : promotions.length === 0
                      ? 'Aucune promotion trouvée'
                      : 'Sélectionner la promotion'}
                  </option>
                  {promotions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2 : Métadonnées du document */}
        <Card className="rounded-3xl border border-hairline bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-teal/15 text-accent-teal dark:bg-teal-900/30 dark:text-teal-300">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-title text-ink dark:text-slate-100">
                  2. Informations sur le Document
                </CardTitle>
                <CardDescription className="text-caption text-ink-muted dark:text-slate-400">
                  Titre, résumé pédagogique et options de visibilité.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Titre du document *</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Ex: Cours 3 — Structure des données arborescentes"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description & Objectifs pédagogiques</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 block w-full rounded-xl border border-hairline bg-white px-3 py-2 text-body-sm text-ink shadow-2xs placeholder:text-ink-faint focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Prérequis, notions abordées ou consignes associées..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="type">Nature du document *</Label>
                <Select id="type" name="type" required defaultValue="cours" className="mt-1">
                  {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="visibility">Visibilité d'accès *</Label>
                <Select id="visibility" name="visibility" required defaultValue="public" className="mt-1">
                  <option value="public">Publique (étudiants de la promo)</option>
                  <option value="private">Privée (brouillon personnel)</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="annee_scolaire">Année scolaire</Label>
                <Input
                  id="annee_scolaire"
                  name="annee_scolaire"
                  placeholder="Ex: 2025-2026"
                  pattern="[0-9]{4}-[0-9]{4}"
                  title="Format attendu : 2025-2026"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3 : Fichier et Dépose */}
        <Card className="rounded-3xl border border-hairline bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-orange/15 text-accent-orange-deep dark:bg-amber-900/30 dark:text-amber-300">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-title text-ink dark:text-slate-100">
                  3. Fichier du Cours
                </CardTitle>
                <CardDescription className="text-caption text-ink-muted dark:text-slate-400">
                  Formats acceptés : PDF, DOCX, PPTX, ZIP (jusqu'à 50 Mo).
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                if (e.dataTransfer.files?.[0]) {
                  setSelectedFile(e.dataTransfer.files[0])
                }
              }}
              className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? 'border-primary bg-primary/10 scale-[1.01]'
                  : selectedFile
                  ? 'border-accent-teal/60 bg-accent-teal/5 dark:bg-teal-950/20'
                  : 'border-hairline bg-canvas-soft/60 hover:border-primary/40 hover:bg-primary/5 dark:bg-slate-800/30 dark:border-slate-700'
              }`}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-teal/20 text-accent-teal">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink dark:text-slate-100 text-body-sm">
                      {selectedFile.name}
                    </p>
                    <p className="text-caption text-ink-muted dark:text-slate-400 mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} Mo · {selectedFile.type || 'Fichier'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-caption text-accent-pink hover:underline"
                  >
                    <X className="h-3.5 w-3.5" /> Retirer le fichier
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink dark:text-slate-100 text-body-sm">
                      Glissez-déposez votre fichier ici, ou cliquez pour parcourir
                    </p>
                    <p className="text-caption text-ink-muted dark:text-slate-400 mt-1">
                      PDF, DOCX, PPTX ou ZIP (50 Mo max)
                    </p>
                  </div>
                </>
              )}

              <input
                id="file"
                name="file"
                type="file"
                accept=".pdf,.docx,.pptx,.zip"
                className="sr-only"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Barre de progression avec animation */}
            {uploadProgress !== null && (
              <div className="space-y-2 rounded-2xl border border-hairline bg-canvas-soft/70 dark:bg-slate-800/40 p-4">
                <div className="flex items-center justify-between text-body-sm font-medium text-ink dark:text-slate-200">
                  <span className="flex items-center gap-2">
                    {uploadDone ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Fichier transféré — finalisation de l'enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4 text-primary animate-pulse" />
                        <span>Téléversement en cours... {uploadProgress}%</span>
                      </>
                    )}
                  </span>
                  <span className="font-mono text-caption text-ink-muted">{uploadProgress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-canvas-soft dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent-teal transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading || !selectedFile || !selectedMatiere || !selectedPromo}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {loading
              ? uploadProgress !== null && uploadProgress < 100
                ? `Envoi ${uploadProgress}%...`
                : 'Enregistrement...'
              : 'Publier le document'}
          </Button>
        </div>
      </form>
    </div>
  )
}

/* ─── Helpers upload direct ──────────────────────────────────────────────── */

async function getUploadSignedUrl(
  userId: string,
  filePath: string,
  _mimeType: string
): Promise<{ signedUrl: string | null }> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('resources')
    .createSignedUploadUrl(filePath)

  if (error || !data?.signedUrl) {
    return { signedUrl: null }
  }
  return { signedUrl: data.signedUrl }
}

function uploadWithProgress(
  signedUrl: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.setRequestHeader('x-upsert', 'false')

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        onProgress(Math.round((evt.loaded / evt.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ ok: true })
      } else {
        resolve({ ok: false, error: `HTTP ${xhr.status}` })
      }
    }

    xhr.onerror = () => resolve({ ok: false, error: 'Erreur réseau' })
    xhr.send(file)
  })
}
