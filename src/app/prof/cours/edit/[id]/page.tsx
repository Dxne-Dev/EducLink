import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EditResourceForm } from './edit-form'

export const metadata = { title: 'Edulink — Modifier la ressource (Enseignant)' }

export default async function ProfEditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isTeacherOrAdmin = profile?.role === 'teacher' || profile?.role === 'admin'
  if (!isTeacherOrAdmin) redirect('/etudiant/dashboard')

  // Récupérer la ressource avec ses jointures
  const { data: resource } = await supabase
    .from('resources')
    .select(`
      *,
      matieres (
        id,
        name,
        niveau_id,
        niveaux (
          id,
          name,
          filiere_id
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!resource) notFound()

  // Si enseignant, vérifier qu'il est l'auteur
  if (profile?.role === 'teacher' && resource.uploaded_by !== user.id) {
    redirect('/prof/mes-cours')
  }

  // Filière et Niveau déduits
  const currentFiliereId = resource.matieres?.niveaux?.filiere_id ?? ''
  const currentNiveauId = resource.matieres?.niveau_id ?? ''

  // Charger toutes les filières
  const { data: filieres } = await supabase
    .from('filieres')
    .select('id, name, code')
    .order('name')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Modifier le document</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Modifiez le cursus (filière, niveau, matière), les métadonnées ou remplacez le fichier existant.
        </p>
      </div>

      <EditResourceForm
        resource={resource}
        initialFiliereId={currentFiliereId}
        initialNiveauId={currentNiveauId}
        filieres={filieres ?? []}
      />
    </div>
  )
}
