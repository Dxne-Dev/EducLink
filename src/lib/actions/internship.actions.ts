'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { internshipSchema } from '@/lib/validations'
import { z } from 'zod'

type InternshipInput = z.infer<typeof internshipSchema>

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

/* ---------- Créer un stage (étudiant) ---------- */

export async function createInternship(formData: FormData) {
  const { supabase, user, role } = await getRole()
  if (!user || role !== 'student') return { error: 'Accès réservé aux étudiants' }

  const rawData: InternshipInput = {
    company_name: formData.get('company_name') as string,
    company_address: (formData.get('company_address') as string) || undefined,
    tutor_name: (formData.get('tutor_name') as string) || undefined,
    tutor_email: (formData.get('tutor_email') as string) || undefined,
    start_date: formData.get('start_date') as string,
    end_date: formData.get('end_date') as string,
    subject: formData.get('subject') as string,
  }

  const validated = internshipSchema.safeParse(rawData)
  if (!validated.success) return { error: validated.error.issues[0].message }

  const { error } = await supabase.from('internships').insert({
    ...validated.data,
    student_id: user.id,
    status: 'submitted',
  })

  if (error) return { error: "Erreur lors de l'enregistrement du stage" }

  revalidatePath('/dashboard/stages')
  return { success: true }
}

/* ---------- Upload rapport (admin) ---------- */

export async function uploadInternshipReport(formData: FormData) {
  const { supabase, user, role } = await getRole()
  if (!user || role !== 'admin') return { error: 'Accès réservé aux administrateurs' }

  const internshipId = formData.get('internship_id') as string
  const file = formData.get('file') as File | null

  if (!internshipId) return { error: 'Stage invalide' }
  if (!file || file.size === 0) return { error: 'Veuillez sélectionner un fichier' }

  const ext = file.name.split('.').pop()
  const filePath = `${internshipId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('internships')
    .upload(filePath, file)

  if (uploadError) return { error: "Erreur lors de l'upload du rapport" }

  const { error } = await supabase.from('internship_reports').insert({
    internship_id: internshipId,
    file_path: filePath,
    file_size: file.size,
    mime_type: file.type,
    is_validated: false,
    is_anonymized: false,
    validated_by: user.id,
  })

  if (error) {
    await supabase.storage.from('internships').remove([filePath])
    return { error: "Erreur lors de l'enregistrement du rapport" }
  }

  revalidatePath('/dashboard/stages')
  revalidatePath('/admin/rapports')
  return { success: true }
}

/* ---------- Valider / noter un rapport (admin) ---------- */

export async function validateReport(reportId: string, grade: number | null) {
  const { supabase, user, role } = await getRole()
  if (!user || role !== 'admin') return { error: 'Accès réservé aux administrateurs' }

  const { error } = await supabase
    .from('internship_reports')
    .update({
      is_validated: true,
      grade,
      validated_by: user.id,
      validated_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  if (error) return { error: 'Erreur lors de la validation' }

  revalidatePath('/admin/rapports')
  revalidatePath('/dashboard/stages')
  return { success: true }
}

export async function deleteReport(reportId: string) {
  const { supabase, role } = await getRole()
  if (role !== 'admin') return { error: 'Accès réservé aux administrateurs' }

  const { data: report } = await supabase
    .from('internship_reports')
    .select('file_path')
    .eq('id', reportId)
    .single()

  if (report?.file_path) {
    await supabase.storage.from('internships').remove([report.file_path])
  }

  const { error } = await supabase
    .from('internship_reports')
    .delete()
    .eq('id', reportId)

  if (error) return { error: 'Erreur lors de la suppression' }

  revalidatePath('/admin/rapports')
  return { success: true }
}
