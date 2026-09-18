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

import { createResource } from '@/lib/actions/resources.actions'
import { emitRealtimeRefresh } from '@/lib/realtime-broadcast'

export default function UploadResourcePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filieres, setFilieres] = useState<{ id: string; name: string; code: string }[]>([])
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [niveaux, setNiveaux] = useState<{ id: string; name: string }[]>([])
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [matieres, setMatieres] = useState<{ id: string; name: string }[]>([])
  const [promotions, setPromotions] = useState<{ id: string; name: string }[]>([])
  const [loadingData, setLoadingData] = useState(true)
  // IDs des matières assignées à l'enseignant (filtre côté client)
  const [myMatiereIds, setMyMatiereIds] = useState<string[] | null>(null)

  const supabase = createClient()

  // 0. Charger les matières assignées à cet enseignant
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: tmRows } = await supabase
        .from('teacher_matieres')
        .select('matiere_id')
        .eq('teacher_id', user.id)
      if (tmRows && tmRows.length > 0) {
        setMyMatiereIds(tmRows.map((r: any) => r.matiere_id))
      } else {
        setMyMatiereIds([]) // pas de restriction si aucune matière assignée
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

  // 2. Quand la filière change : charger ses niveaux et ses promotions
  useEffect(() => {
    if (!selectedFiliere) {
      setNiveaux([])
      setSelectedNiveau('')
      setMatieres([])
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
      setSelectedNiveau('')
      setMatieres([])
      setPromotions(promosRes.data ?? [])
    })
  }, [selectedFiliere])

  // 3. Quand le niveau change : charger les matières de ce niveau (filtrées si enseignant)
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
        let allMatieres = data ?? []
        // Si l'enseignant a des matières assignées, on filtre
        if (myMatiereIds && myMatiereIds.length > 0) {
          allMatieres = allMatieres.filter((m) => myMatiereIds.includes(m.id))
        }
        setMatieres(allMatieres)
      })
  }, [selectedNiveau, myMatiereIds])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const fd = new FormData(form)
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

    const res = await createResource(fd)
    if (res?.error) {
      setError(res.error)
      setLoading(false)
      return
    }

    emitRealtimeRefresh('realtime:resources')
    router.push('/dashboard/mes-cours')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Ajouter une ressource</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Déposez un cours, TP, TD, examen ou fiche pour un niveau et une filière donnés.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-heading-3">Nouvelle ressource</CardTitle>
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

            {/* Année scolaire (optionnel) */}
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
                  disabled={!selectedNiveau}
                  required
                >
                  <option value="" disabled selected>
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
                  disabled={!selectedFiliere}
                  required
                >
                  <option value="" disabled selected>
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

            <div className="space-y-1.5">
              <Label htmlFor="file">Fichier *</Label>
              <Input id="file" name="file" type="file" required accept=".pdf,.docx,.pptx,.zip" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => router.back()}>Annuler</Button>
              <Button type="submit" loading={loading}>
                {loading ? 'Publication...' : 'Publier la ressource'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}