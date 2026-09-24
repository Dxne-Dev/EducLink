import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingView } from '@/components/landing/LandingView'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'student'
    if (role === 'admin') {
      redirect('/admin/dashboard')
    } else if (role === 'teacher') {
      redirect('/prof/dashboard')
    } else {
      redirect('/etudiant/dashboard')
    }
  }

  return <LandingView />
}
