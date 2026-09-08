'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { resourceSchema } from '@/lib/validations'
import { z } from 'zod'

type ResourceInput = z.infer<typeof resourceSchema>

export async function createResource(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const rawData: ResourceInput = {
    title: formData.get('title') as string,
    description: formData.get('description') as string || undefined,
    type: formData.get('type') as ResourceInput['type'],
    matiere_id: formData.get('matiere_id') as string,
    promo_id: formData.get('promo_id') as string,
  }

  const validated = resourceSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

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
      return { error: 'Erreur lors de l\'upload du fichier' }
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
    status: 'draft',
  })

  if (error) {
    return { error: 'Erreur lors de la création de la ressource' }
  }

  revalidatePath('/dashboard/cours')
  return { success: true }
}

export async function updateResource(id: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string || undefined,
    type: formData.get('type') as string,
    matiere_id: formData.get('matiere_id') as string,
    promo_id: formData.get('promo_id') as string,
  }

  const { error } = await supabase
    .from('resources')
    .update({
      title: rawData.title,
      description: rawData.description,
      type: rawData.type,
      matiere_id: rawData.matiere_id,
      promo_id: rawData.promo_id,
    })
    .eq('id', id)

  if (error) {
    return { error: 'Erreur lors de la mise à jour' }
  }

  revalidatePath('/dashboard/cours')
  return { success: true }
}

export async function deleteResource(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: resource } = await supabase
    .from('resources')
    .select('file_path')
    .eq('id', id)
    .single()

  if (resource?.file_path) {
    await supabase.storage.from('resources').remove([resource.file_path])
  }

  const { error } = await supabase.from('resources').delete().eq('id', id)

  if (error) {
    return { error: 'Erreur lors de la suppression' }
  }

  revalidatePath('/dashboard/cours')
  return { success: true }
}

export async function validateResource(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('resources')
    .update({ status: 'validated' })
    .eq('id', id)

  if (error) {
    return { error: 'Erreur lors de la validation' }
  }

  revalidatePath('/dashboard/cours')
  return { success: true }
}

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
      promotions(year),
      profiles(full_name)
    `)
    .eq('status', 'validated')
    .order('created_at', { ascending: false })

  if (filters?.matiere_id) {
    query = query.eq('matiere_id', filters.matiere_id)
  }
  if (filters?.promotion_id) {
    query = query.eq('promo_id', filters.promotion_id)
  }
  if (filters?.type) {
    query = query.eq('type', filters.type)
  }

  const { data, error } = await query

  if (error) {
    return { error: 'Erreur lors de la récupération des ressources' }
  }

  return { data }
}

export async function getResource(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('resources')
    .select(`
      *,
      matieres(name, code, niveaux(name, filieres(name))),
      promotions(year),
      profiles(full_name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    return { error: 'Ressource non trouvée' }
  }

  return { data }
}
