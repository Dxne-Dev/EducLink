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
import { RESOURCE_TYPE_LABELS, ALLOWED_RESOURCE_TYPES } from '@/lib/constants'
import { createResourceMeta } from '@/lib/actions/resources.actions'
import { emitRealtimeRefresh } from '@/lib/realtime-broadcast'
import { UploadCloud, CheckCircle2, FileText } from 'lucide-react'
import type { ResourceVisibility } from '@/types/database'

export default function ProfUploadResourcePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // Upload progress (0–100, null = pas encore démarré)
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

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
        setMyMatiereIds(tmRows.map((r: any) => r.matiere_id))
      } else {
        setMyMatiereIds([])
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
    const fileInput = form.elements.namedItem('file') as HTMLInputElement
    const file = fileInput.files?.[0]

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

    // Supabase JS v2 ne supporte pas onUploadProgress natif ; on simule via XMLHttpRequest
    // pour avoir une vraie barre de progression
    const { signedUrl } = await getUploadSignedUrl(user.id, filePath, file.type)

    let finalFilePath = filePath

    if (signedUrl) {
      // Upload via XHR pour avoir la progression
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
      // Fallback : upload SDK (sans progression)
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
    const visibility = (form.elements.namedItem('visibility') as HTMLSelectElement)?.value as ResourceVisibility ?? 'private'
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
      setLoading(false)
      return
    }

    emitRealtimeRefresh('realtime:resources')
    router.push('/prof/mes-cours')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Publier un document</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Déposez un cours, TP, TD, examen ou fiche pour vos matières et promotions assignées.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-heading-3">Nouveau document</CardTitle>
          <CardDescription>Les champs marqués * sont obligatoires.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4">
              <Alert variant="danger">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Titre *</Label>
              <Input id="title" name="title" required placeholder="Ex: Algorithmique avancée et graphes" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="block w-full rounded-sm border border-[rgb(221,221,221)] bg-white px-3 py-1.5 text-body-sm text-ink transition-all placeholder:text-ink-faint focus:border-primary focus:outline-none focus:shadow-level-1"
                placeholder="Objectifs pédagogiques, prérequis ou résumé du cours..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="type">Type de ressource *</Label>
                <Select id="type" name="type" required defaultValue="cours">
                  {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="visibility">Visibilité *</Label>
                <Select id="visibility" name="visibility" required defaultValue="private">
                  <option value="private">Privée (visible uniquement par vous)</option>
                  <option value="public">Publique (accessible aux étudiants de la promo)</option>
                </Select>
              </div>
            </div>

            {/* Année scolaire */}
            <div className="space-y-1.5">
              <Label htmlFor="annee_scolaire">Année scolaire</Label>
              <Input
                id="annee_scolaire"
                name="annee_scolaire"
                placeholder="Ex: 2024-2025"
                pattern="[0-9]{4}-[0-9]{4}"
                title="Format attendu : 2024-2025"
              />
            </div>

            {/* Cursus : Filière & Niveau */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="filiere_select">Filière *</Label>
                <Select
                  id="filiere_select"
                  value={selectedFiliere}
                  onChange={(e) => setSelectedFiliere(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    {loadingData ? 'Chargement des filières...' : 'Sélectionner une filière'}
                  </option>
                  {filieres.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="niveau_select">Niveau (L1, L2, L3, M1...) *</Label>
                <Select
                  id="niveau_select"
                  value={selectedNiveau}
                  onChange={(e) => setSelectedNiveau(e.target.value)}
                  disabled={!selectedFiliere}
                  required
                >
                  <option value="" disabled>
                    {!selectedFiliere
                      ? "Choisissez d'abord une filière"
                      : niveaux.length === 0
                      ? 'Aucun niveau disponible'
                      : 'Sélectionner le niveau'}
                  </option>
                  {niveaux.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Matière & Promotion */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="matiere_id">Matière *</Label>
                <Select
                  id="matiere_id"
                  name="matiere_id"
                  value={selectedMatiere}
                  onChange={(e) => setSelectedMatiere(e.target.value)}
                  disabled={!selectedNiveau}
                  required
                >
                  <option value="" disabled hidden>
                    {!selectedNiveau
                      ? "Choisissez d'abord un niveau"
                      : matieres.length === 0
                      ? 'Aucune matière configurée'
                      : 'Sélectionner la matière'}
                  </option>
                  {matieres.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="promo_id">Promotion cible *</Label>
                <Select
                  id="promo_id"
                  name="promo_id"
                  value={selectedPromo}
                  onChange={(e) => setSelectedPromo(e.target.value)}
                  disabled={!selectedFiliere}
                  required
                >
                  <option value="" disabled hidden>
                    {!selectedFiliere
                      ? "Choisissez d'abord une filière"
                      : promotions.length === 0
                      ? 'Aucune promotion pour cette filière'
                      : 'Sélectionner la promotion'}
                  </option>
                  {promotions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Sélection du fichier */}
            <div className="space-y-1.5">
              <Label htmlFor="file">Fichier *</Label>
              <label
                htmlFor="file"
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  selectedFile
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-hairline bg-canvas-soft hover:border-primary/30 hover:bg-primary/5'
                }`}
              >
                {selectedFile ? (
                  <>
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium text-ink text-body-sm">{selectedFile.name}</p>
                      <p className="text-caption text-ink-muted">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
                      </p>
                    </div>
                    <span className="text-caption font-medium text-primary">Changer de fichier</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-ink-faint" />
                    <div>
                      <p className="font-medium text-ink-secondary text-body-sm">
                        Cliquez pour sélectionner un fichier
                      </p>
                      <p className="text-caption text-ink-faint">PDF, DOCX, PPTX ou ZIP</p>
                    </div>
                  </>
                )}
                <input
                  id="file"
                  name="file"
                  type="file"
                  required
                  accept=".pdf,.docx,.pptx,.zip"
                  className="sr-only"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {/* Barre de progression de l'upload */}
            {uploadProgress !== null && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-caption text-ink-muted">
                  <span>
                    {uploadDone
                      ? 'Fichier envoyé — enregistrement en cours…'
                      : `Upload en cours… ${uploadProgress}%`}
                  </span>
                  {uploadDone && <CheckCircle2 className="h-4 w-4 text-success" />}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-canvas-soft">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => router.back()}>Annuler</Button>
              <Button type="submit" loading={loading}>
                {loading
                  ? uploadProgress !== null && uploadProgress < 100
                    ? `Upload ${uploadProgress}%`
                    : 'Enregistrement…'
                  : 'Publier la ressource'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Helpers upload direct ──────────────────────────────────────────────── */

/**
 * Génère une URL signée pour un upload direct navigateur → Supabase Storage.
 * Utilise le client SDK browser (session RLS active) plutôt qu'un XHR public.
 */
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

/**
 * Upload via XHR pour suivre la progression (onprogress).
 * Renvoie { ok: true } ou { ok: false, error: string }.
 */
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
