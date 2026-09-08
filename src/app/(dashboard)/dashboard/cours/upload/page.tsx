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

export default function UploadResourcePage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

    // Upload fichier vers Storage
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Non authentifié')
      setLoading(false)
      return
    }

    const ext = file.name.split('.').pop()
    const filePath = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, file)

    if (uploadError) {
      setError("Erreur lors de l'upload du fichier")
      setLoading(false)
      return
    }

    // Créer la ressource en base
    const { error: insertError } = await supabase.from('resources').insert({
      title: fd.get('title') as string,
      description: (fd.get('description') as string) || null,
      type: fd.get('type') as string,
      matiere_id: fd.get('matiere_id') as string,
      promo_id: fd.get('promo_id') as string,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.id,
      status: 'draft',
    })

    if (insertError) {
      // Nettoyer le fichier si l'insertion échoue
      await supabase.storage.from('resources').remove([filePath])
      setError("Erreur lors de l'enregistrement de la ressource")
      setLoading(false)
      return
    }

    router.push('/dashboard/cours')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Ajouter une ressource</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Déposez un cours, TP, TD, examen ou fiche. Votre ressource sera visible par tous une fois validée.
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
              <Input id="title" name="title" required placeholder="Ex: Cours sur les algorithmes de tri" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="block w-full rounded-sm border border-[rgb(221,221,221)] bg-white px-3 py-1.5 text-body-sm text-ink transition-all placeholder:text-ink-faint focus:border-primary focus:outline-none focus:shadow-level-1"
                placeholder="Décrivez brièvement le contenu"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type">Type de ressource *</Label>
              <Select id="type" name="type" required defaultValue="cours">
                {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="matiere_id">Matière *</Label>
                <MatiereSelect />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promo_id">Promotion *</Label>
                <PromotionSelect />
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

function MatiereSelect() {
  const [matieres, setMatieres] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('matieres')
      .select('id, name')
      .then(({ data }) => {
        setMatieres(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <Select id="matiere_id" name="matiere_id" required>
      <option value="" disabled>
        {loading ? 'Chargement des matières...' : 'Sélectionnez une matière'}
      </option>
      {matieres.map((m) => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </Select>
  )
}

function PromotionSelect() {
  const [promotions, setPromotions] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('promotions')
      .select('id, name')
      .then(({ data }) => {
        setPromotions(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <Select id="promo_id" name="promo_id" required>
      <option value="" disabled>
        {loading ? 'Chargement des promotions...' : 'Sélectionnez une promotion'}
      </option>
      {promotions.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </Select>
  )
}