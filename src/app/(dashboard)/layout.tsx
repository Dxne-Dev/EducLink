import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'Edulink - Tableau de bord',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen bg-canvas-soft dark:bg-slate-950 text-ink dark:text-slate-100 transition-colors" suppressHydrationWarning>
      <Sidebar role={profile?.role} />
      <div className="flex min-w-0 flex-1 flex-col" suppressHydrationWarning>
        <Header fullName={profile?.full_name} role={profile?.role} />
        <main className="flex-1 p-6" suppressHydrationWarning>{children}</main>
      </div>
    </div>
  )
}