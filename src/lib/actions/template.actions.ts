'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { templateSchema } from '@/lib/validations'
import { z } from 'zod'

type TemplateInput = z.infer<typeof templateSchema>

async function getRole() {
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

export async function createTemplate(formData: FormData) {
  const { supabase, user, role } = await getRole()
  if (!user || (role !== 'admin' && role !== 'teacher')) {
    return { error: 'Accès réservé aux enseignants et administrateurs' }
  }

  const validated = templateSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    category: formData.get('category'),
    filiere_id: formData.get('filiere_id') || undefined,
  })
  if (!validated.success) return { error: validated.error.issues[0].message }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { error: 'Veuillez sélectionner un fichier' }

  const ext = file.name.split('.').pop()
  const filePath = `${validated.data.category}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('templates')
    .upload(filePath, file)

  if (uploadError) return { error: "Erreur lors de l'upload du modèle" }

  const { error } = await supabase.from('templates').insert({
    name: validated.data.name,
    description: validated.data.description,
    category: validated.data.category,
    filiere_id: validated.data.filiere_id || null,
    file_path: filePath,
    file_size: file.size,
    mime_type: file.type,
    uploaded_by: user.id,
  })

  if (error) {
    await supabase.storage.from('templates').remove([filePath])
    return { error: "Erreur lors de l'enregistrement du modèle" }
  }

  revalidatePath('/dashboard/templates')
  revalidatePath('/dashboard/stages')
  revalidatePath('/admin/rapports')
  return { success: true }
}

export async function deleteTemplate(id: string) {
  const { supabase, role } = await getRole()
  if (role !== 'admin' && role !== 'teacher') {
    return { error: 'Accès refusé' }
  }

  const { data: template } = await supabase
    .from('templates')
    .select('file_path')
    .eq('id', id)
    .single()

  if (template?.file_path) {
    await supabase.storage.from('templates').remove([template.file_path])
  }

  const { error } = await supabase.from('templates').delete().eq('id', id)
  if (error) return { error: 'Erreur lors de la suppression' }

  revalidatePath('/dashboard/templates')
  revalidatePath('/dashboard/stages')
  revalidatePath('/admin/rapports')
  return { success: true }
}
