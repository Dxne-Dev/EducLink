'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  let targetUrl = '/dashboard'
  if (authData?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (profile?.role === 'admin') targetUrl = '/admin/dashboard'
    else if (profile?.role === 'teacher') targetUrl = '/prof/dashboard'
    else if (profile?.role === 'student') targetUrl = '/etudiant/dashboard'
  }

  revalidatePath('/', 'layout')
  redirect(targetUrl)
}

/**
 * Inscription avec vérification préalable du registre pour les enseignants.
 * Pour un teacher : si email+nom ne figurent pas dans teacher_registry → erreur bloquante
 * (Supabase n'envoie jamais l'email de confirmation dans ce cas).
 */
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email    = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const role     = formData.get('role') as 'student' | 'teacher'
  const filiereId = formData.get('filiere_id') as string | null  // étudiant uniquement

  // ── Vérification du registre pour les enseignants ─────────────────────────
  if (role === 'teacher') {
    const cleanEmail = email.trim().toLowerCase()

    // 1. Essai via fonction RPC (contourne le blocage RLS anonyme)
    let entry: { id: string; is_used: boolean } | null = null
    const { data: rpcData, error: rpcError } = await supabase.rpc('check_teacher_email', {
      p_email: cleanEmail,
    })

    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      entry = rpcData[0]
    } else {
      // Fallback : requête directe par email (insensible à la casse)
      const { data: directData } = await supabase
        .from('teacher_registry')
        .select('id, is_used')
        .ilike('email', cleanEmail)
        .maybeSingle()

      entry = directData
    }

    if (!entry) {
      return {
        error:
          "Vos informations ne figurent pas dans notre registre d'enseignants. " +
          "Contactez l'administration pour être ajouté.",
      }
    }

    if (entry.is_used) {
      return {
        error:
          "Un compte existe déjà pour cet enseignant. " +
          "Utilisez la fonction \"Mot de passe oublié\" si vous avez perdu l'accès.",
      }
    }
  }

  // ── Création du compte Supabase ────────────────────────────────────────────
  const metadata: Record<string, string> = {
    full_name: fullName,
    role,
  }
  const niveauId = formData.get('niveau_id') as string | null
  let activePromoId: string | null = null

  // Stocker filiere_id, niveau_id et rattacher automatiquement à la promotion active
  if (role === 'student' && filiereId) {
    metadata.filiere_id = filiereId
    if (niveauId) {
      metadata.niveau_id = niveauId
      const { data: activePromo } = await supabase
        .from('promotions')
        .select('id')
        .eq('filiere_id', filiereId)
        .eq('niveau_id', niveauId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (activePromo) {
        activePromoId = activePromo.id
        metadata.promo_id = activePromo.id
      }
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${baseUrl}/auth/callback?next=/login?verified=true`,
      data: metadata,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // ── Inscription automatique de l'étudiant dans sa promotion ───────────────
  if (role === 'student' && data.user && activePromoId) {
    await supabase
      .from('profiles')
      .update({ promo_id: activePromoId, niveau_id: niveauId })
      .eq('id', data.user.id)

    await supabase
      .from('enrollments')
      .upsert({
        student_id: data.user.id,
        promotion_id: activePromoId,
      })
  }

  // ── Marquer le registre comme utilisé pour les enseignants ────────────────
  if (role === 'teacher' && data.user) {
    // Mise à jour best-effort (non bloquant si échec)
    await supabase
      .from('teacher_registry')
      .update({ is_used: true })
      .ilike('email', email.trim())
  }

  // Pas de session = email de confirmation envoyé
  if (!data.session) {
    return { needsConfirmation: true }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function getPublicFilieres() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('filieres')
    .select('id, name, code')
    .order('name')
  return data ?? []
}

export async function getLevelsByFiliere(filiereId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('niveaux')
    .select('id, name')
    .eq('filiere_id', filiereId)
    .order('sort_order')
  return data ?? []
}

export async function requestPasswordReset(email: string) {
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${baseUrl}/reset-password`,
  })
  if (error) {
    return { error: error.message }
  }
  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
