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
import { updateResource } from '@/lib/actions/resources.actions'
import { emitRealtimeRefresh } from '@/lib/realtime-broadcast'
import { formatFileSize } from '@/lib/utils'
import { FileText } from 'lucide-react'

interface EditResourceFormProps {
  resource: any
  initialFiliereId: string
  initialNiveauId: string
  filieres: { id: string; name: string; code: string }[]
}

export function EditResourceForm({
  resource,
  initialFiliereId,
  initialNiveauId,
  filieres,
}: EditResourceFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(resource.title ?? '')
  const [description, setDescription] = useState(resource.description ?? '')
  const [type, setType] = useState(resource.type ?? 'cours')
  const [visibility, setVisibility] = useState(resource.visibility ?? 'private')

  const [selectedFiliere, setSelectedFiliere] = useState(initialFiliereId)
  const [niveaux, setNiveaux] = useState<{ id: string; name: string }[]>([])
  const [selectedNiveau, setSelectedNiveau] = useState(initialNiveauId)
  const [matieres, setMatieres] = useState<{ id: string; name: string }[]>([])
  const [selectedMatiere, setSelectedMatiere] = useState(resource.matiere_id ?? '')
  const [promotions, setPromotions] = useState<{ id: string; name: string }[]>([])
  const [selectedPromo, setSelectedPromo] = useState(resource.promo_id ?? '')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Synchronise l'état si la ressource est rechargée depuis le serveur
  useEffect(() => {
    setTitle(resource.title ?? '')
    setDescription(resource.description ?? '')
    setType(resource.type ?? 'cours')
    setVisibility(resource.visibility ?? 'private')
    setSelectedMatiere(resource.matiere_id ?? '')
    setSelectedPromo(resource.promo_id ?? '')
  }, [resource])

  // 1. Charger niveaux et promotions quand filiere change
  useEffect(() => {
    if (!selectedFiliere) {
      setNiveaux([])
      setPromotions([])
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
      setPromotions(promosRes.data ?? [])
    })
  }, [selectedFiliere])

  // 2. Charger matières quand niveau change
  useEffect(() => {
    if (!selectedNiveau) {
      setMatieres([])
      return
    }

    supabase
      .from('matieres')
      .select('id, name')
      .eq('niveau_id', selectedNiveau)
      .order('name')
      .then(({ data }) => {
        setMatieres(data ?? [])
      })
  }, [selectedNiveau])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const fd = new FormData(form)

    const fileInput = form.elements.namedItem('file') as HTMLInputElement
    const file = fileInput.files?.[0]

    if (file && file.size > 0 && !ALLOWED_RESOURCE_TYPES.includes(file.type as any)) {
      setError('Type de fichier non autorisé. Utilisez PDF, DOCX, PPTX ou ZIP.')
      setLoading(false)
      return
    }

    const res = await updateResource(resource.id, fd)
    if (res?.error) {
      setError(res.error)
      setLoading(false)
      return
    }

    emitRealtimeRefresh('realtime:resources')
    router.push('/dashboard/cours')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-3">Détails du document</CardTitle>
        <CardDescription>Tous les champs sont rééditables. Laissez le fichier vide pour conserver l'actuel.</CardDescription>
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
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full rounded-sm border border-[rgb(221,221,221)] bg-white px-3 py-1.5 text-body-sm text-ink transition-all placeholder:text-ink-faint focus:border-primary focus:outline-none focus:shadow-level-1"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="type">Type de ressource *</Label>
              <Select
                id="type"
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                {Object.entries(RESOURCE_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="visibility">Visibilité *</Label>
              <Select
                id="visibility"
                name="visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                required
              >
                <option value="private">Privée (visible uniquement par vous)</option>
                <option value="public">Publique (accessible aux étudiants de la promo)</option>
              </Select>
            </div>
          </div>

          {/* Cursus : Filière & Niveau */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="filiere_select">Filière *</Label>
              <Select
                id="filiere_select"
                value={selectedFiliere}
                onChange={(e) => {
                  setSelectedFiliere(e.target.value)
                  setSelectedNiveau('')
                  setSelectedMatiere('')
                  setSelectedPromo('')
                }}
                required
              >
                <option value="" disabled>Sélectionner une filière</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="niveau_select">Niveau *</Label>
              <Select
                id="niveau_select"
                value={selectedNiveau}
                onChange={(e) => {
                  setSelectedNiveau(e.target.value)
                  setSelectedMatiere('')
                }}
                disabled={!selectedFiliere}
                required
              >
                <option value="" disabled>
                  {!selectedFiliere ? "Choisissez d'abord une filière" : 'Sélectionner le niveau'}
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
                <option value="" disabled>
                  {!selectedNiveau ? "Choisissez d'abord un niveau" : 'Sélectionner la matière'}
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
                <option value="" disabled>
                  {!selectedFiliere ? "Choisissez d'abord une filière" : 'Sélectionner la promotion'}
                </option>
                {promotions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Remplacement du fichier */}
          <div className="space-y-2 rounded-lg border border-hairline bg-canvas-soft p-4">
            <Label htmlFor="file">Fichier joint</Label>
            {resource.file_path && (
              <div className="flex items-center gap-2 text-body-sm text-ink-muted">
                <FileText className="h-4 w-4 text-primary" />
                <span className="truncate">Fichier actuel : {resource.file_size ? formatFileSize(resource.file_size) : 'Enregistré'}</span>
              </div>
            )}
            <Input
              id="file"
              name="file"
              type="file"
              accept=".pdf,.docx,.pptx,.zip"
              className="bg-white"
            />
            <p className="text-caption text-ink-faint">
              Laissez ce champ vide si vous ne souhaitez pas remplacer le fichier actuel.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              {loading ? 'Enregistrement...' : 'Mettre à jour la ressource'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
