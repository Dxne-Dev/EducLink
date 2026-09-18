'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  Users,
  GraduationCap,
  Building2,
  ClipboardList,
  BookMarked,
  ChevronsRight,
  UserCheck,
  Award,
  ChevronDown,
  UserCircle,
  Library,
  Upload,
} from 'lucide-react'

interface SidebarProps {
  role?: string
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(true)
  const isFiliereActive = pathname.startsWith('/dashboard/profs') || pathname.startsWith('/dashboard/ressources')
  const [filiereOpen, setFiliereOpen] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('edulink_sidebar_open')
    if (saved !== null) {
      setOpen(saved === 'true')
    }
  }, [])

  function handleToggle() {
    const next = !open
    setOpen(next)
    localStorage.setItem('edulink_sidebar_open', String(next))
  }

  const isStudent = role === 'student'
  const isTeacher = role === 'teacher'
  const isAdmin = role === 'admin'

  const homeHref = isAdmin ? '/admin/dashboard' : isTeacher ? '/prof/dashboard' : '/etudiant/dashboard'
  const isDashboardActive = isAdmin
    ? (pathname === '/admin/dashboard' || pathname === '/admin')
    : isTeacher
    ? pathname === '/prof/dashboard'
    : (pathname === '/etudiant/dashboard' || pathname === '/dashboard')

  return (
    <nav
      suppressHydrationWarning
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-hairline bg-white shadow-sm transition-all duration-300 ease-in-out lg:flex',
        open ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo / Wordmark */}
      <div className="mb-4 border-b border-hairline pb-3 pt-3 px-2">
        <Link
          href={homeHref}
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-canvas-soft',
            !open && 'justify-center'
          )}
          title="Edulink"
        >
          {/* Logo icon */}
          <div className="grid size-9 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-primary to-secondary shadow-sm">
            <img
              src="/android-chrome-192x192.png"
              alt="Edulink"
              className="h-6 w-6 rounded object-cover"
            />
          </div>
          {open && (
            <div
              className={cn(
                'transition-opacity duration-200',
                open ? 'opacity-100' : 'opacity-0'
              )}
            >
              <span className="font-amatry text-xl tracking-wide text-ink">
                Edulink
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav items */}
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {/* Tableau de bord */}
        <NavOption
          href={homeHref}
          icon={LayoutDashboard}
          label="Tableau de bord"
          active={isDashboardActive}
          open={open}
        />

        {isStudent && (
          <>
            {/* Ma filière (avec sous-menu) */}
            <div>
              <button
                type="button"
                onClick={() => setFiliereOpen(!filiereOpen)}
                title="Ma filière"
                className={cn(
                  'relative flex h-11 w-full items-center rounded-md transition-all duration-150',
                  open ? 'justify-between px-3' : 'justify-center px-0',
                  isFiliereActive
                    ? 'bg-primary/5 text-primary font-medium'
                    : 'text-ink-muted hover:bg-canvas-soft hover:text-ink'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-full w-10 shrink-0 place-content-center">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  {open && (
                    <span className="text-body-sm font-medium">
                      Ma filière
                    </span>
                  )}
                </div>
                {open && (
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-ink-muted transition-transform duration-200',
                      filiereOpen ? 'rotate-180' : ''
                    )}
                  />
                )}
              </button>

              {/* Sous-menu */}
              {filiereOpen && open && (
                <div className="ml-7 mt-1 space-y-1 border-l border-hairline pl-2">
                  <Link
                    href="/etudiant/profs"
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-3 py-2 text-body-sm transition-colors',
                      pathname === '/etudiant/profs' || pathname === '/dashboard/profs'
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-ink-muted hover:bg-canvas-soft hover:text-ink'
                    )}
                  >
                    <UserCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>Mes profs</span>
                  </Link>

                  <Link
                    href="/etudiant/ressources"
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-3 py-2 text-body-sm transition-colors',
                      pathname === '/etudiant/ressources' || pathname === '/dashboard/ressources'
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-ink-muted hover:bg-canvas-soft hover:text-ink'
                    )}
                  >
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    <span>Mes ressources</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Stages */}
            <NavOption
              href="/etudiant/stages"
              icon={Briefcase}
              label="Stages & Gabarits"
              active={pathname === '/etudiant/stages' || pathname === '/dashboard/stages'}
              open={open}
            />

            {/* Profile */}
            <NavOption
              href="/etudiant/profile"
              icon={UserCircle}
              label="Mon Profil"
              active={pathname === '/etudiant/profile' || pathname === '/dashboard/profile'}
              open={open}
            />
          </>
        )}

        {isTeacher && (
          <>
            <div className="pt-2 pb-1">
              {open && (
                <p className="px-3 text-eyebrow uppercase text-ink-faint">
                  Enseignant
                </p>
              )}
            </div>
            <NavOption
              href="/prof/mes-cours"
              icon={Library}
              label="Ma Bibliothèque"
              active={pathname.startsWith('/prof/mes-cours') || pathname.startsWith('/dashboard/mes-cours')}
              open={open}
            />
            <NavOption
              href="/prof/cours/upload"
              icon={Upload}
              label="Publier un document"
              active={pathname === '/prof/cours/upload' || pathname === '/dashboard/cours/upload'}
              open={open}
            />
            <NavOption
              href="/prof/matieres"
              icon={BookMarked}
              label="Mes Matières"
              active={pathname === '/prof/matieres' || pathname === '/dashboard/matieres'}
              open={open}
            />
            <NavOption
              href="/prof/profile"
              icon={UserCircle}
              label="Mon Profil"
              active={pathname === '/prof/profile' || pathname === '/dashboard/profile'}
              open={open}
            />
          </>
        )}
        {isAdmin && (
          <>
            <div className="pt-2 pb-1">
              {open && (
                <p className="px-3 text-eyebrow uppercase text-ink-faint">
                  Administration
                </p>
              )}
            </div>
            <NavOption
              href="/admin/filieres"
              icon={GraduationCap}
              label="Filières"
              active={pathname === '/admin/filieres'}
              open={open}
            />
            <NavOption
              href="/admin/matieres"
              icon={BookMarked}
              label="Matières & Niveaux"
              active={pathname === '/admin/matieres'}
              open={open}
            />
            <NavOption
              href="/admin/promotions"
              icon={Building2}
              label="Promotions"
              active={pathname === '/admin/promotions'}
              open={open}
            />
            <NavOption
              href="/admin/users"
              icon={Users}
              label="Utilisateurs"
              active={pathname === '/admin/users'}
              open={open}
            />
            <NavOption
              href="/admin/teachers"
              icon={Award}
              label="Enseignants & Matières"
              active={pathname.startsWith('/admin/teachers')}
              open={open}
            />
            <NavOption
              href="/admin/rapports"
              icon={ClipboardList}
              label="Stages & Gabarits"
              active={pathname === '/admin/rapports'}
              open={open}
            />
          </>
        )}
      </div>

      {/* Toggle button — anchored at bottom */}
      <button
        onClick={handleToggle}
        className="absolute bottom-0 left-0 right-0 border-t border-hairline transition-colors hover:bg-canvas-soft"
        title={open ? 'Réduire la barre latérale' : 'Agrandir la barre latérale'}
      >
        <div className="flex items-center p-3">
          <div className="grid size-10 place-content-center">
            <ChevronsRight
              className={cn(
                'h-4 w-4 text-ink-muted transition-transform duration-300',
                open && 'rotate-180'
              )}
            />
          </div>
          {open && (
            <span
              className={cn(
                'text-body-sm font-medium text-ink-muted transition-opacity duration-200',
                open ? 'opacity-100' : 'opacity-0'
              )}
            >
              Réduire
            </span>
          )}
        </div>
      </button>
    </nav>
  )
}

function NavOption({
  href,
  icon: Icon,
  label,
  active,
  open,
}: {
  href: string
  icon: React.ElementType
  label: string
  active: boolean
  open: boolean
}) {
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        'relative flex h-11 w-full items-center rounded-md transition-all duration-150',
        open ? 'gap-3 px-3' : 'justify-center px-0',
        active
          ? 'bg-primary/10 text-primary border-l-2 border-primary font-medium'
          : 'text-ink-muted hover:bg-canvas-soft hover:text-ink'
      )}
    >
      {/* Icon — always centred in its slot */}
      <div className="grid h-full w-10 shrink-0 place-content-center">
        <Icon className="h-4 w-4" />
      </div>
      {open && (
        <span
          className={cn(
            'text-body-sm transition-opacity duration-200',
            open ? 'opacity-100' : 'opacity-0'
          )}
        >
          {label}
        </span>
      )}
    </Link>
  )
}