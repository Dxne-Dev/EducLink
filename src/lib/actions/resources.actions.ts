'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { resourceSchema } from '@/lib/validations'
import type { ResourceVisibility } from '@/types/database'
import { z } from 'zod'

type ResourceInput = z.infer<typeof resourceSchema>

/* ---------- Helpers ---------- */

async function getCallerProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, role: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return { supabase, user, role: profile?.role ?? null }
}

function revalidateResourcePaths(resourceId?: string) {
  revalidatePath('/prof/mes-cours')
  revalidatePath('/prof/dashboard')
  revalidatePath('/dashboard/cours')
  revalidatePath('/dashboard/ressources')
  revalidatePath('/dashboard/mes-cours')
  revalidatePath('/etudiant/dashboard')
  revalidatePath('/etudiant/ressources')
  if (resourceId) {
    revalidatePath(`/prof/mes-cours/${resourceId}/partage`)
    revalidatePath(`/dashboard/mes-cours/${resourceId}/partage`)
  }
}

/* ---------- Créer une ressource (teacher/admin uniquement) ---------- */

/**
 * Version optimisée : le fichier est uploadé directement du navigateur vers
 * Supabase Storage (1 seul aller-réseau). Cette action ne reçoit que les
 * métadonnées texte + le chemin du fichier déjà stocké.
 */
export async function createResourceMeta(payload: {
  title: string
  description?: string
  type: ResourceInput['type']
  matiere_id: string
  promo_id: string
  visibility: ResourceVisibility
  annee_scolaire?: string | null
  file_path: string
  file_size: number
  mime_type: string | null
}) {
  const { supabase, user, role } = await getCallerProfile()
  if (!user) return { error: 'Non authentifié' }
  if (role !== 'teacher' && role !== 'admin') {
    return { error: 'La création de ressources est réservée aux enseignants.' }
  }

  const validated = resourceSchema.safeParse({
    title: payload.title,
    description: payload.description,
    type: payload.type,
    matiere_id: payload.matiere_id,
    promo_id: payload.promo_id,
  })
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { error } = await supabase.from('resources').insert({
    title: validated.data.title,
    description: validated.data.description,
    type: validated.data.type,
    matiere_id: validated.data.matiere_id,
    promo_id: validated.data.promo_id,
    file_path: payload.file_path,
    file_size: payload.file_size,
    mime_type: payload.mime_type,
    uploaded_by: user.id,
    status: 'validated',
    visibility: payload.visibility,
    annee_scolaire: payload.annee_scolaire ?? null,
  })

  if (error) {
    return { error: `Erreur lors de la création de la ressource : ${error.message}` }
  }

  revalidateResourcePaths()
  return { success: true }
}

/**
 * Version legacy (garde la compatibilité) — upload du fichier côté serveur.
 * Préférer createResourceMeta + upload client pour de meilleures performances.
 */
export async function createResource(formData: FormData) {
  const { supabase, user, role } = await getCallerProfile()
  if (!user) return { error: 'Non authentifié' }
  if (role !== 'teacher' && role !== 'admin') {
    return { error: 'La création de ressources est réservée aux enseignants.' }
  }

  const rawData: ResourceInput = {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || undefined,
    type: formData.get('type') as ResourceInput['type'],
    matiere_id: formData.get('matiere_id') as string,
    promo_id: formData.get('promo_id') as string,
  }
  const anneeScolaire = (formData.get('annee_scolaire') as string) || null

  const validated = resourceSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const visibility = (formData.get('visibility') as ResourceVisibility) ?? 'private'
  const file = formData.get('file') as File | null
  let filePath = ''

  if (file && file.size > 0) {
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    filePath = `${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, file)

    if (uploadError) {
      return { error: `Erreur lors de l'upload du fichier : ${uploadError.message}` }
    }
  }

  const { error } = await supabase.from('resources').insert({
    title: validated.data.title,
    description: validated.data.description,
    type: validated.data.type,
    matiere_id: validated.data.matiere_id,
    promo_id: validated.data.promo_id,
    file_path: filePath,
    file_size: file?.size || 0,
    mime_type: file?.type || null,
    uploaded_by: user.id,
    status: 'validated',
    visibility,
    annee_scolaire: anneeScolaire,
  })

  if (error) {
    return { error: `Erreur lors de la création de la ressource : ${error.message}` }
  }

  revalidatePath('/prof/mes-cours')
  revalidatePath('/prof/dashboard')
  revalidatePath('/dashboard/cours')
  revalidatePath('/dashboard/ressources')
  revalidatePath('/etudiant/dashboard')
  return { success: true }
}

/* ---------- Modifier une ressource (complète avec fichier éventuel) ---------- */

export async function updateResource(id: string, formData: FormData) {
  const { supabase, user, role } = await getCallerProfile()
  if (!user) return { error: 'Non authentifié' }
  if (role !== 'teacher' && role !== 'admin') {
    return { error: 'Accès refusé' }
  }

  // Vérifier propriétaire
  const { data: existing } = await supabase
    .from('resources')
    .select('id, uploaded_by, file_path')
    .eq('id', id)
    .single()

  if (!existing) return { error: 'Ressource introuvable' }
  if (role === 'teacher' && existing.uploaded_by !== user.id) {
    return { error: 'Vous ne pouvez modifier que vos propres ressources' }
  }

  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || null
  const type = formData.get('type') as string
  const matiere_id = formData.get('matiere_id') as string | null
  const promo_id = formData.get('promo_id') as string | null
  const visibility = formData.get('visibility') as ResourceVisibility | null

  if (!title || !title.trim()) {
    return { error: 'Le titre est obligatoire' }
  }

  const updateData: Record<string, unknown> = {
    title: title.trim(),
    description: description ? description.trim() : null,
  }

  if (type) updateData.type = type
  if (matiere_id) updateData.matiere_id = matiere_id
  if (promo_id) updateData.promo_id = promo_id
  if (visibility) updateData.visibility = visibility

  // Fichier optionnel lors de la modification
  const file = formData.get('file') as File | null
  if (file && file.size > 0) {
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    const newFilePath = `${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(newFilePath, file)

    if (uploadError) {
      return { error: "Erreur lors de l'upload du nouveau fichier" }
    }

    // Supprimer l'ancien fichier
    if (existing.file_path) {
      await supabase.storage.from('resources').remove([existing.file_path])
    }

    updateData.file_path = newFilePath
    updateData.file_size = file.size
    updateData.mime_type = file.type
  }

  const { error } = await supabase
    .from('resources')
    .update(updateData)
    .eq('id', id)

  if (error) return { error: 'Erreur lors de la mise à jour de la ressource' }

  revalidateResourcePaths(id)
  return { success: true }
}

/* ---------- Changer la visibilité ---------- */

export async function setResourceVisibility(id: string, visibility: ResourceVisibility) {
  const { supabase, user, role } = await getCallerProfile()
  if (!user || (role !== 'teacher' && role !== 'admin')) {
    return { error: 'Accès refusé' }
  }

  const { error } = await supabase
    .from('resources')
    .update({ visibility })
    .eq('id', id)

  if (error) return { error: 'Erreur lors de la mise à jour de la visibilité' }

  revalidateResourcePaths(id)
  return { success: true }
}

/* ---------- Supprimer une ressource (owner ou admin) ---------- */

export async function deleteResource(id: string) {
  const { supabase, user, role } = await getCallerProfile()
  if (!user) return { error: 'Non authentifié' }
  if (role !== 'teacher' && role !== 'admin') {
    return { error: 'Accès refusé' }
  }

  const { data: resource } = await supabase
    .from('resources')
    .select('file_path, uploaded_by')
    .eq('id', id)
    .single()

  // Teacher : ne peut supprimer que SES ressources
  if (role === 'teacher' && resource?.uploaded_by !== user.id) {
    return { error: "Vous ne pouvez supprimer que vos propres ressources." }
  }

  if (resource?.file_path) {
    await supabase.storage.from('resources').remove([resource.file_path])
  }

  const { error } = await supabase.from('resources').delete().eq('id', id)
  if (error) return { error: 'Erreur lors de la suppression' }

  revalidateResourcePaths(id)
  return { success: true }
}

/* ---------- Multi-promo : partager une ressource ---------- */

export async function grantResourceToPromo(
  resourceId: string,
  promoId: string,
  visibility: ResourceVisibility
) {
  const { supabase, user, role } = await getCallerProfile()
  if (!user || (role !== 'teacher' && role !== 'admin')) {
    return { error: 'Accès refusé' }
  }

  // Vérifier que le teacher est bien le propriétaire
  if (role === 'teacher') {
    const { data: resource } = await supabase
      .from('resources')
      .select('uploaded_by')
      .eq('id', resourceId)
      .single()

    if (resource?.uploaded_by !== user.id) {
      return { error: 'Vous ne pouvez partager que vos propres ressources.' }
    }
  }

  const { error } = await supabase
    .from('resource_promo_access')
    .upsert(
      { resource_id: resourceId, promo_id: promoId, visibility, granted_by: user.id },
      { onConflict: 'resource_id,promo_id' }
    )

  if (error) return { error: 'Erreur lors du partage' }

  revalidateResourcePaths(resourceId)
  return { success: true }
}

export async function revokeResourceFromPromo(resourceId: string, promoId: string) {
  const { supabase, user, role } = await getCallerProfile()
  if (!user || (role !== 'teacher' && role !== 'admin')) {
    return { error: 'Accès refusé' }
  }

  const { error } = await supabase
    .from('resource_promo_access')
    .delete()
    .eq('resource_id', resourceId)
    .eq('promo_id', promoId)

  if (error) return { error: 'Erreur lors de la révocation' }

  revalidateResourcePaths(resourceId)
  return { success: true }
}

/* ---------- Lecture ---------- */

export async function getResources(filters?: {
  matiere_id?: string
  promotion_id?: string
  type?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('resources')
    .select(`
      *,
      matieres(name, code),
      promotions(year_start, year_end, name),
      profiles(full_name)
    `)
    .eq('status', 'validated')
    .order('created_at', { ascending: false })

  if (filters?.matiere_id) query = query.eq('matiere_id', filters.matiere_id)
  if (filters?.promotion_id) query = query.eq('promo_id', filters.promotion_id)
  if (filters?.type) query = query.eq('type', filters.type)

  const { data, error } = await query
  if (error) return { error: 'Erreur lors de la récupération des ressources' }

  return { data }
}

export async function getResource(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('resources')
    .select(`
      *,
      matieres(name, code, niveaux(name, filieres(name))),
      promotions(year_start, year_end, name),
      profiles(full_name),
      resource_promo_access(promo_id, visibility, promotions(name, year_start, year_end))
    `)
    .eq('id', id)
    .single()

  if (error) return { error: 'Ressource non trouvée' }
  return { data }
}

/* ---------- (Garde pour la compatibilité) ---------- */
export async function validateResource(id: string) {
  const { supabase, role } = await getCallerProfile()
  if (role !== 'admin') return { error: 'Accès refusé' }

  const { error } = await supabase
    .from('resources')
    .update({ status: 'validated' })
    .eq('id', id)

  if (error) return { error: 'Erreur lors de la validation' }
  revalidateResourcePaths(id)
  return { success: true }
}

/* ---------- Bibliothèque personnelle de l'enseignant ---------- */

/**
 * Renvoie TOUTES les ressources de l'enseignant connecté (public + privées),
 * avec les jointures nécessaires pour afficher matière, niveau, filière et promos partagées.
 */
export async function getMyResources(filters?: {
  matiere_id?: string
  type?: string
  visibility?: string
  annee_scolaire?: string
}) {
  const { supabase, user, role } = await getCallerProfile()
  if (!user) return { error: 'Non authentifié' }
  if (role !== 'teacher' && role !== 'admin') return { error: 'Accès refusé' }

  let query = supabase
    .from('resources')
    .select(`
      *,
      matieres(
        id,
        name,
        code,
        niveaux(name, filieres(name, code))
      ),
      promotions(id, name, year_start, year_end),
      resource_promo_access(
        promo_id,
        visibility,
        promotions(id, name, year_start, year_end)
      )
    `)
    .eq('uploaded_by', user.id)
    .order('created_at', { ascending: false })

  if (filters?.matiere_id) query = query.eq('matiere_id', filters.matiere_id)
  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.visibility) query = query.eq('visibility', filters.visibility)
  if (filters?.annee_scolaire) query = query.eq('annee_scolaire', filters.annee_scolaire)

  const { data, error } = await query
  if (error) return { error: 'Erreur lors de la récupération de vos ressources' }
  return { data }
}

/**
 * Renvoie les matières assignées à l'enseignant connecté
 * via la table pivot teacher_matieres.
 */
export async function getMyMatieres() {
  const { supabase, user, role } = await getCallerProfile()
  if (!user) return { error: 'Non authentifié' }
  if (role !== 'teacher' && role !== 'admin') return { error: 'Accès refusé' }

  const { data, error } = await supabase
    .from('teacher_matieres')
    .select(`
      matiere_id,
      matieres(
        id,
        name,
        code,
        niveaux(id, name, filieres(id, name, code))
      )
    `)
    .eq('teacher_id', user.id)

  if (error) return { error: 'Erreur lors de la récupération de vos matières' }

  // Dédupliquer et aplatir
  const matieres = (data ?? [])
    .map((row: any) => row.matieres)
    .filter(Boolean)
    .filter((m: any, idx: number, arr: any[]) => arr.findIndex((x: any) => x.id === m.id) === idx)

  return { data: matieres }
}

/* ---------- Toggle visibilité examen (alias sémantique) ---------- */

/**
 * Bascule la visibilité d'une ressource de type examen.
 * Typiquement appelé le jour de l'épreuve pour rendre le sujet public.
 */
export async function toggleExamVisibility(id: string, makePublic: boolean) {
  return setResourceVisibility(id, makePublic ? 'public' : 'private')
}
