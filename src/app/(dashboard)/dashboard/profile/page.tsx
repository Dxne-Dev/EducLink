import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

export default async function ProfileRedirectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'student'

  if (role === 'admin') {
    redirect('/admin/profile')
  } else if (role === 'teacher') {
    redirect('/prof/profile')
  } else {
    redirect('/etudiant/profile')
  }
}