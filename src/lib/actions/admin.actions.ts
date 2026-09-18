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
  revalidatePath('/admin/dashboard')
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
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function deleteFiliere(id: string) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const { error } = await supabase.from('filieres').delete().eq('id', id)
  if (error) return { error: 'Impossible de supprimer (filière référencée)' }

  revalidatePath('/admin/filieres')
  revalidatePath('/admin/dashboard')
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
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function deleteNiveau(id: string) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const { error } = await supabase.from('niveaux').delete().eq('id', id)
  if (error) return { error: 'Impossible de supprimer le niveau' }

  revalidatePath('/admin/matieres')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

/* ---------- Matières ---------- */

export async function createMatiere(formData: FormData) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const niveau_id = (formData.get('niveau_id') as string)?.trim()
  if (!niveau_id) return { error: 'Niveau obligatoire' }

  const namesRaw = (formData.get('names') as string || formData.get('name') as string || '').trim()
  const codesRaw = (formData.get('codes') as string || formData.get('code') as string || '').trim()

  if (!namesRaw) {
    return { error: 'Veuillez renseigner au moins une matière' }
  }

  // Séparer par virgule ou saut de ligne
  const names = namesRaw
    .split(/[,;\n]/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0)

  if (names.length === 0) {
    return { error: 'Veuillez renseigner au moins un nom de matière valide' }
  }

  const codes = codesRaw
    ? codesRaw
        .split(/[,;\n]/)
        .map((c) => c.trim())
    : []

  const rows = names.map((name, index) => ({
    name,
    code: codes[index] && codes[index].length > 0 ? codes[index] : null,
    niveau_id,
  }))

  const { error } = await supabase.from('matieres').insert(rows)
  if (error) {
    return { error: `Erreur lors de la création des matières : ${error.message}` }
  }

  revalidatePath('/admin/matieres')
  revalidatePath('/admin/dashboard')
  return { success: true, count: rows.length }
}

export async function deleteMatiere(id: string) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const { error } = await supabase.from('matieres').delete().eq('id', id)
  if (error) return { error: 'Impossible de supprimer la matière' }

  revalidatePath('/admin/matieres')
  revalidatePath('/admin/dashboard')
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
  revalidatePath('/admin/dashboard')
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
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function deletePromotion(id: string) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const { error } = await supabase.from('promotions').delete().eq('id', id)
  if (error) return { error: 'Impossible de supprimer la promotion' }

  revalidatePath('/admin/promotions')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

/* ---------- Registre Enseignants ---------- */

export async function addTeacherToRegistry(formData: FormData) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const full_name = (formData.get('full_name') as string)?.trim()
  const employee_id = (formData.get('employee_id') as string)?.trim() || null
  const filiere_id = (formData.get('filiere_id') as string) || null

  if (!email || !full_name) {
    return { error: "L'email et le nom complet sont requis." }
  }

  const { error } = await supabase.from('teacher_registry').insert({
    email,
    full_name,
    employee_id,
    filiere_id,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Cet email ou matricule est déjà dans le registre.' }
    }
    return { error: "Erreur lors de l'ajout au registre." }
  }

  revalidatePath('/admin/teachers')
  revalidatePath('/admin/teachers/registry')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function deleteTeacherFromRegistry(id: string) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const { error } = await supabase.from('teacher_registry').delete().eq('id', id)
  if (error) return { error: 'Erreur lors de la suppression' }

  revalidatePath('/admin/teachers')
  revalidatePath('/admin/teachers/registry')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function updatePromotionLevel(promotionId: string, niveauId: string) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const { error } = await supabase
    .from('promotions')
    .update({ niveau_id: niveauId })
    .eq('id', promotionId)

  if (error) return { error: 'Erreur lors de la mise à jour du niveau de la promotion' }

  revalidatePath('/admin/promotions')
  revalidatePath('/admin/dashboard')
  revalidatePath('/dashboard/profs')
  revalidatePath('/etudiant/profs')
  revalidatePath('/etudiant/dashboard')
  return { success: true }
}

/* ---------- Affectation Enseignants <-> Matières ---------- */

export async function assignTeacherMatieres(
  target: { teacher_id?: string; teacher_registry_id?: string },
  matiereIds: string[]
) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  if (!target.teacher_id && !target.teacher_registry_id) {
    return { error: 'Identifiant enseignant manquant' }
  }

  // Si teacher_id est fourni, supprimer les anciennes liaisons de cet enseignant
  if (target.teacher_id) {
    await supabase.from('teacher_matieres').delete().eq('teacher_id', target.teacher_id)
  }
  // Si teacher_registry_id est fourni, supprimer les anciennes liaisons de ce registre
  if (target.teacher_registry_id) {
    await supabase.from('teacher_matieres').delete().eq('teacher_registry_id', target.teacher_registry_id)
  }

  if (matiereIds.length > 0) {
    const rows = matiereIds.map((matiere_id) => ({
      teacher_id: target.teacher_id || null,
      teacher_registry_id: target.teacher_registry_id || null,
      matiere_id,
    }))

    const { error } = await supabase.from('teacher_matieres').insert(rows)
    if (error) return { error: "Erreur lors de l'affectation des matières" }
  }

  revalidatePath('/admin/teachers')
  revalidatePath('/admin/teachers/registry')
  revalidatePath('/admin/dashboard')
  revalidatePath('/dashboard/profs')
  revalidatePath('/etudiant/profs')
  revalidatePath('/prof/matieres')
  return { success: true }
}

export async function removeTeacherMatiere(id: string) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const { error } = await supabase.from('teacher_matieres').delete().eq('id', id)
  if (error) return { error: 'Erreur lors du retrait de la matière' }

  revalidatePath('/admin/teachers')
  revalidatePath('/admin/teachers/registry')
  revalidatePath('/admin/dashboard')
  revalidatePath('/dashboard/profs')
  revalidatePath('/etudiant/profs')
  revalidatePath('/prof/matieres')
  return { success: true }
}


