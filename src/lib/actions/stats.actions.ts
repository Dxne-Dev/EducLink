'use server'

import { createClient } from '@/lib/supabase/server'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return { supabase, user, role: profile?.role ?? null }
}

function monthStarts(): string[] {
  const labels: string[] = []
  const now = new Date()
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }))
  }
  return labels
}

function monthStartISO(): string[] {
  const starts: string[] = []
  const now = new Date()
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    starts.push(d.toISOString())
  }
  return starts
}

/* ---------- Stats enseignant ---------- */

export async function getTeacherStats() {
  const ctx = await requireAuth()
  if (!ctx || (ctx.role !== 'teacher' && ctx.role !== 'admin')) {
    return { error: 'Accès refusé' }
  }

  const { supabase, user } = ctx
  const starts = monthStartISO()

  const [resourcesRes, viewsRes] = await Promise.all([
    supabase
      .from('resources')
      .select('id, created_at, type, visibility', { count: 'exact', head: false })
      .eq('uploaded_by', user.id),

    supabase
      .from('resource_views')
      .select('resource_id, action, created_at'),
  ])

  const allResources = resourcesRes.data ?? []
  const allViews = viewsRes.data ?? []

  /* Consulter = toute vue sur les ressources publiques de l'enseignant */
  const teacherPublicResourceIds = allResources.map((r) => r.id)

  const consultationsByMonth = starts.map((start) => {
    const next = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 1).toISOString()
    return allViews.filter((v) => {
      if (!teacherPublicResourceIds.includes(v.resource_id)) return false
      const d = new Date(v.created_at).toISOString()
      return d >= start && d < next
    }).length
  })

  const downloadsByMonth = starts.map((start) => {
    const next = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 1).toISOString()
    return allResources.filter((r) => {
      const d = new Date(r.created_at).toISOString()
      return d >= start && d < next
    }).length
  })

  const totalCount = allResources.length
  const publicCount = allResources.filter((r) => r.visibility === 'public').length
  const privateCount = allResources.filter((r) => r.visibility === 'private').length

  const typeCounts: Record<string, number> = {}
  for (const r of allResources) {
    typeCounts[r.type] = (typeCounts[r.type] ?? 0) + 1
  }

  return {
    success: true,
    data: {
      months: monthStarts(),
      downloadsByMonth,
      consultationsByMonth,
      totalCount,
      publicCount,
      privateCount,
      typeCounts,
    },
  }
}

/* ---------- Stats étudiant ---------- */

export async function getStudentStats(filiereId?: string, niveauId?: string, promoId?: string) {
  const ctx = await requireAuth()
  if (!ctx) return { error: 'Non authentifié' }

  const { supabase, user } = ctx
  const starts = monthStartISO()

  let baseQuery = supabase.from('resources').select('created_at, type', { count: 'exact', head: false }).eq('visibility', 'public')

  if (filiereId && niveauId) {
    baseQuery = baseQuery.eq('matiere_id', filiereId)
  }

  const { data: allResources } = await baseQuery
  const resources = allResources ?? []

  /* Vues étudiant sur ses propres ressources (consultations) */
  const { data: studentViews } = await supabase
    .from('resource_views')
    .select('resource_id, created_at')
    .eq('user_id', user.id)

  const allViews = studentViews ?? []

  const consultationsByMonth = starts.map((start) => {
    const next = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 1).toISOString()
    return allViews.filter((v) => {
      const d = new Date(v.created_at).toISOString()
      return d >= start && d < next
    }).length
  })

  const downloadsByMonth = starts.map((start) => {
    const next = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 1).toISOString()
    return resources.filter((r) => {
      const d = new Date(r.created_at).toISOString()
      return d >= start && d < next
    }).length
  })

  const typeCounts: Record<string, number> = {}
  for (const r of resources) {
    typeCounts[r.type] = (typeCounts[r.type] ?? 0) + 1
  }

  let teacherCount = 0
  if (niveauId) {
    const { data: matieres } = await supabase
      .from('matieres')
      .select('id')
      .eq('niveau_id', niveauId)

    const matiereIds = matieres?.map((m) => m.id) ?? []
    if (matiereIds.length > 0) {
      const { data: a } = await supabase
        .from('teacher_matieres')
        .select('teacher_id, teacher_registry_id')
        .in('matiere_id', matiereIds)
      const keys = new Set((a ?? []).map((x) => x.teacher_id || x.teacher_registry_id).filter(Boolean))
      teacherCount = keys.size
    }
  }

  return {
    success: true,
    data: {
      months: monthStarts(),
      downloadsByMonth,
      consultationsByMonth,
      totalCount: resources.length,
      teacherCount,
      typeCounts,
    },
  }
}

/* ---------- Stats admin (plateforme entière) ---------- */

export async function getAdminStats() {
  const ctx = await requireAuth()
  if (!ctx || ctx.role !== 'admin') {
    return { error: 'Accès refusé' }
  }

  const { supabase } = ctx
  const starts = monthStartISO()

  const [profilesRes, resourcesRes, viewsRes] = await Promise.all([
    supabase.from('profiles').select('created_at, role', { count: 'exact', head: false }),
    supabase.from('resources').select('created_at, type', { count: 'exact', head: false }),
    supabase.from('resource_views').select('created_at'),
  ])

  const allProfiles = profilesRes.data ?? []
  const allResources = resourcesRes.data ?? []
  const allViews = viewsRes.data ?? []

  const registrationsByMonth = starts.map((start) => {
    const next = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 1).toISOString()
    return allProfiles.filter((p) => {
      const d = new Date(p.created_at).toISOString()
      return d >= start && d < next
    }).length
  })

  const coursesByMonth = starts.map((start) => {
    const next = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 1).toISOString()
    return allResources.filter((r) => {
      const d = new Date(r.created_at).toISOString()
      return d >= start && d < next
    }).length
  })

  const consultationsByMonth = starts.map((start) => {
    const next = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 1).toISOString()
    return allViews.filter((v) => {
      const d = new Date(v.created_at).toISOString()
      return d >= start && d < next
    }).length
  })

  const totalStudents = allProfiles.filter((p) => p.role === 'student').length
  const totalTeachers = allProfiles.filter((p) => p.role === 'teacher').length

  const typeCounts: Record<string, number> = {}
  for (const r of allResources) {
    typeCounts[r.type] = (typeCounts[r.type] ?? 0) + 1
  }

  return {
    success: true,
    data: {
      months: monthStarts(),
      registrationsByMonth,
      coursesByMonth,
      consultationsByMonth,
      totalProfiles: allProfiles.length,
      totalStudents,
      totalTeachers,
      totalResources: allResources.length,
      totalViews: allViews.length,
      typeCounts,
    },
  }
}

/* ---------- Logger une vue (client) ---------- */

export async function logView(resourceId: string, action: string = 'view') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase.from('resource_views').insert({
    resource_id: resourceId,
    user_id: user.id,
    action,
  })

  if (error) return { error: 'Erreur lors du logging' }
  return { success: true }
}