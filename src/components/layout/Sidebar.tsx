'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  Search,
  FileText,
  Users,
  GraduationCap,
  Building2,
  ClipboardList,
  BookMarked,
} from 'lucide-react'

interface SidebarProps {
  role?: string
}

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/cours', label: 'Cours & Ressources', icon: BookOpen },
  { href: '/dashboard/stages', label: 'Stages', icon: Briefcase },
  { href: '/dashboard/recherche', label: 'Recherche', icon: Search },
  { href: '/dashboard/templates', label: 'Modèles', icon: FileText },
]

const adminItems = [
  { href: '/admin/filieres', label: 'Filières', icon: GraduationCap },
  { href: '/admin/matieres', label: 'Matières & Niveaux', icon: BookMarked },
  { href: '/admin/promotions', label: 'Promotions', icon: Building2 },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/rapports', label: 'Rapports de stage', icon: ClipboardList },
]

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 shrink-0 border-r border-hairline bg-white lg:block">
      {/* Wordmark */}
      <div className="flex h-16 items-center border-b border-hairline px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-white">
            <GraduationCap className="h-4 w-4" />
          </span>
          <span className="text-title font-bold text-ink">Edulink</span>
        </Link>
      </div>

      <nav className="space-y-0.5 p-3">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} active={pathname === item.href}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}

        {role === 'admin' && (
          <>
            <div className="my-3 border-t border-hairline" />
            <p className="px-3 pb-1 pt-2 text-eyebrow uppercase text-ink-faint">
              Administration
            </p>
            {adminItems.map((item) => (
              <NavLink key={item.href} href={item.href} active={pathname === item.href}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'relative flex items-center gap-3 rounded-md px-3 py-2 text-body-sm font-medium transition-colors',
        active
          ? 'bg-canvas-soft text-ink'
          : 'text-ink-muted hover:bg-canvas-soft hover:text-ink'
      )}
    >
      {/* Indicateur actif — primaire (spec ex-app-shell-row) */}
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-primary" />
      )}
      {children}
    </Link>
  )
}