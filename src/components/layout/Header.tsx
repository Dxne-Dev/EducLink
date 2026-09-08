import Link from 'next/link'
import { logout } from '@/lib/actions/auth.actions'
import { GraduationCap, LogOut } from 'lucide-react'

interface HeaderProps {
  fullName?: string
}

export function Header({ fullName }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-hairline bg-white px-6">
      <div className="lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-white">
            <GraduationCap className="h-4 w-4" />
          </span>
          <span className="text-title font-bold text-ink">Edulink</span>
        </Link>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas-soft text-title font-semibold text-ink-secondary">
          {fullName?.[0]?.toUpperCase() ?? '?'}
        </span>
        <span className="hidden text-body-sm text-ink-secondary sm:block">
          {fullName}
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 text-body-sm text-ink-muted transition-colors hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </form>
      </div>
    </header>
  )
}