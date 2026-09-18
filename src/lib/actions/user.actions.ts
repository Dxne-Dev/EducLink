'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

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

const ROLES: UserRole[] = ['student', 'teacher', 'admin']

export async function updateUserRole(userId: string, role: UserRole) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }
  if (!ROLES.includes(role)) return { error: 'Rôle invalide' }

  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) return { error: 'Erreur lors de la mise à jour du rôle' }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const supabase = await requireAdmin()
  if (!supabase) return { error: 'Accès refusé' }

  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id === userId) return { error: 'Vous ne pouvez pas supprimer votre propre compte' }

  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return { error: 'Erreur lors de la suppression de l\'utilisateur' }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function getUsers() {
  const supabase = await requireAdmin()
  if (!supabase) return { data: [] }

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .order('created_at', { ascending: false })

  return { data: data ?? [] }
}

export async function updateMyProfile(fullName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }
  if (!fullName.trim()) return { error: 'Le nom ne peut pas être vide' }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName.trim() })
    .eq('id', user.id)

  if (error) return { error: error.message || 'Erreur lors de la mise à jour du profil' }

  revalidatePath('/dashboard/profile')
  return { success: true }
}

export async function updateMyPassword(newPassword: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }
  if (newPassword.length < 6) {
    return { error: 'Le mot de passe doit comporter au moins 6 caractères.' }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }

  return { success: true }
}

export async function updateMyAvatar(avatarUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/profile')
  return { success: true }
}

