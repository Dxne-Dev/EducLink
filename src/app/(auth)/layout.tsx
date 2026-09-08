import type { Metadata } from 'next'
import { AuthSplitPanel } from '@/components/auth/AuthSplitPanel'

export const metadata: Metadata = {
  title: 'Edulink - Connexion',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col md:h-screen md:flex-row">
      {/* Colonne gauche — formulaire */}
      <section className="flex flex-1 items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">{children}</div>
      </section>

      {/* Colonne droite — hero + témoignages (desktop) */}
      <AuthSplitPanel />
    </div>
  )
}