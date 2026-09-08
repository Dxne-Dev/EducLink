'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  filiereSchema,
  niveauSchema,
  matiereSchema,
  promotionSchema,
} from '@/lib/validations'
import { z } from 'zod'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return null
  return supabase
}

/* ---------- Filières ---------- */

export async function createFiliere(formData: FormData) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const validated = filiereSchema.safeParse({
    name: formData.get('name'),
    code: formData.get('code'),
    description: formData.get('description') || undefined,
  })
  if (!validated.success) return { error: validated.error.issues[0].message }

  const { error } = await supabase.from('filieres').insert(validated.data)
  if (error) return { error: 'Erreur lors de la création de la filière' }

  revalidatePath('/admin/filieres')
  return { success: true }
}

export async function updateFiliere(id: string, formData: FormData) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const validated = filiereSchema.safeParse({
    name: formData.get('name'),
    code: formData.get('code'),
    description: formData.get('description') || undefined,
  })
  if (!validated.success) return { error: validated.error.issues[0].message }

  const { error } = await supabase.from('filieres').update(validated.data).eq('id', id)
  if (error) return { error: 'Erreur lors de la mise à jour' }

  revalidatePath('/admin/filieres')
  return { success: true }
}

export async function deleteFiliere(id: string) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const { error } = await supabase.from('filieres').delete().eq('id', id)
  if (error) return { error: 'Impossible de supprimer (filière référencée)' }

  revalidatePath('/admin/filieres')
  return { success: true }
}

/* ---------- Niveaux ---------- */

export async function createNiveau(formData: FormData) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const validated = niveauSchema.safeParse({
    name: formData.get('name'),
    filiere_id: formData.get('filiere_id'),
    sort_order: Number(formData.get('sort_order')),
  })
  if (!validated.success) return { error: validated.error.issues[0].message }

  const { error } = await supabase.from('niveaux').insert(validated.data)
  if (error) return { error: 'Erreur lors de la création du niveau' }

  revalidatePath('/admin/matieres')
  return { success: true }
}

export async function deleteNiveau(id: string) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const { error } = await supabase.from('niveaux').delete().eq('id', id)
  if (error) return { error: 'Impossible de supprimer le niveau' }

  revalidatePath('/admin/matieres')
  return { success: true }
}

/* ---------- Matières ---------- */

export async function createMatiere(formData: FormData) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const validated = matiereSchema.safeParse({
    name: formData.get('name'),
    code: formData.get('code') || undefined,
    niveau_id: formData.get('niveau_id'),
  })
  if (!validated.success) return { error: validated.error.issues[0].message }

  const { error } = await supabase.from('matieres').insert(validated.data)
  if (error) return { error: 'Erreur lors de la création de la matière' }

  revalidatePath('/admin/matieres')
  return { success: true }
}

export async function deleteMatiere(id: string) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const { error } = await supabase.from('matieres').delete().eq('id', id)
  if (error) return { error: 'Impossible de supprimer la matière' }

  revalidatePath('/admin/matieres')
  return { success: true }
}

/* ---------- Promotions ---------- */

export async function createPromotion(formData: FormData) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const validated = promotionSchema.safeParse({
    name: formData.get('name'),
    filiere_id: formData.get('filiere_id'),
    niveau_id: formData.get('niveau_id'),
    year_start: Number(formData.get('year_start')),
    year_end: Number(formData.get('year_end')),
  })
  if (!validated.success) return { error: validated.error.issues[0].message }

  const { error } = await supabase.from('promotions').insert(validated.data)
  if (error) return { error: 'Erreur lors de la création de la promotion' }

  revalidatePath('/admin/promotions')
  return { success: true }
}

export async function setPromotionActive(id: string, isActive: boolean) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const { error } = await supabase
    .from('promotions')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) return { error: 'Erreur lors de la mise à jour' }

  revalidatePath('/admin/promotions')
  return { success: true }
}

export async function deletePromotion(id: string) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const { error } = await supabase.from('promotions').delete().eq('id', id)
  if (error) return { error: 'Impossible de supprimer la promotion' }

  revalidatePath('/admin/promotions')
  return { success: true }
}
