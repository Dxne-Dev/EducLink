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
  const isFiliereActive = pathname.startsWith('/dashboard/profs') || pathname.startsWith('/dashboard/ressources') || pathname.startsWith('/etudiant/profs') || pathname.startsWith('/etudiant/ressources')
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
    <aside
      suppressHydrationWarning
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-md transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900/95 lg:flex z-40',
        open ? 'w-64' : 'w-20'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-slate-200/80 px-4 dark:border-slate-800">
        <Link
          href={homeHref}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800',
            !open && 'justify-center'
          )}
          title="Edulink"
        >
          <div className="grid size-9 shrink-0 place-content-center rounded-xl bg-gradient-to-tr from-primary to-secondary shadow-sm text-white font-bold">
            <img
              src="/android-chrome-192x192.png"
              alt="Edulink"
              className="h-6 w-6 rounded-lg object-cover"
            />
          </div>
          {open && (
            <div className="flex flex-col overflow-hidden transition-opacity duration-200">
              <span className="font-amatry text-xl tracking-wide text-slate-900 dark:text-white leading-none">
                Edulink
              </span>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate">
                Portail Académique
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4 scrollbar-thin">
        {/* Main Dashboard Link */}
        <NavItem
          href={homeHref}
          icon={LayoutDashboard}
          label="Tableau de bord"
          active={isDashboardActive}
          open={open}
        />

        {/* Student Navigation */}
        {isStudent && (
          <>
            <SectionHeading label="Menu Étudiant" open={open} />

            {/* Filiere dropdown */}
            <div>
              <button
                type="button"
                onClick={() => setFiliereOpen(!filiereOpen)}
                title="Ma filière"
                className={cn(
                  'group relative flex h-11 w-full items-center rounded-xl transition-all duration-200 cursor-pointer',
                  open ? 'justify-between px-3' : 'justify-center px-0',
                  isFiliereActive
                    ? 'bg-primary/10 text-primary font-semibold dark:bg-primary/20 dark:text-sky-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-full w-8 shrink-0 place-content-center">
                    <GraduationCap className="h-4 w-4 transition-transform group-hover:scale-110" />
                  </div>
                  {open && (
                    <span className="text-sm">
                      Ma filière
                    </span>
                  )}
                </div>
                {open && (
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200 text-slate-400',
                      filiereOpen ? 'rotate-180' : ''
                    )}
                  />
                )}
              </button>

              {filiereOpen && open && (
                <div className="ml-5 mt-1 space-y-1 border-l-2 border-slate-200/80 pl-3 dark:border-slate-800">
                  <Link
                    href="/etudiant/profs"
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                      pathname === '/etudiant/profs' || pathname === '/dashboard/profs'
                        ? 'bg-primary/10 text-primary font-semibold dark:bg-primary/20 dark:text-sky-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    <UserCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>Mes profs</span>
                  </Link>

                  <Link
                    href="/etudiant/ressources"
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                      pathname === '/etudiant/ressources' || pathname === '/dashboard/ressources'
                        ? 'bg-primary/10 text-primary font-semibold dark:bg-primary/20 dark:text-sky-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    <span>Mes ressources</span>
                  </Link>
                </div>
              )}
            </div>

            <NavItem
              href="/etudiant/stages"
              icon={Briefcase}
              label="Stages & Gabarits"
              active={pathname === '/etudiant/stages' || pathname === '/dashboard/stages'}
              open={open}
            />

            <NavItem
              href="/etudiant/profile"
              icon={UserCircle}
              label="Mon Profil"
              active={pathname === '/etudiant/profile'}
              open={open}
            />
          </>
        )}

        {/* Teacher Navigation */}
        {isTeacher && (
          <>
            <SectionHeading label="Enseignement" open={open} />
            <NavItem
              href="/prof/mes-cours"
              icon={Library}
              label="Ma Bibliothèque"
              active={pathname.startsWith('/prof/mes-cours') || pathname.startsWith('/dashboard/mes-cours')}
              open={open}
            />
            <NavItem
              href="/prof/cours/upload"
              icon={Upload}
              label="Publier un cours"
              active={pathname === '/prof/cours/upload' || pathname === '/dashboard/cours/upload'}
              open={open}
            />
            <NavItem
              href="/prof/matieres"
              icon={BookMarked}
              label="Mes Matières"
              active={pathname === '/prof/matieres' || pathname === '/dashboard/matieres'}
              open={open}
            />
            <NavItem
              href="/prof/profile"
              icon={UserCircle}
              label="Mon Profil"
              active={pathname === '/prof/profile'}
              open={open}
            />
          </>
        )}

        {/* Admin Navigation */}
        {isAdmin && (
          <>
            <SectionHeading label="Administration" open={open} />
            <NavItem
              href="/admin/filieres"
              icon={GraduationCap}
              label="Filières"
              active={pathname === '/admin/filieres'}
              open={open}
            />
            <NavItem
              href="/admin/matieres"
              icon={BookMarked}
              label="Matières & Niveaux"
              active={pathname === '/admin/matieres'}
              open={open}
            />
            <NavItem
              href="/admin/promotions"
              icon={Building2}
              label="Promotions"
              active={pathname === '/admin/promotions'}
              open={open}
            />
            <NavItem
              href="/admin/users"
              icon={Users}
              label="Utilisateurs"
              active={pathname === '/admin/users'}
              open={open}
            />
            <NavItem
              href="/admin/teachers"
              icon={Award}
              label="Enseignants & Matières"
              active={pathname.startsWith('/admin/teachers')}
              open={open}
            />
            <NavItem
              href="/admin/rapports"
              icon={ClipboardList}
              label="Stages & Gabarits"
              active={pathname === '/admin/rapports'}
              open={open}
            />
            <NavItem
              href="/admin/profile"
              icon={UserCircle}
              label="Mon Profil"
              active={pathname === '/admin/profile'}
              open={open}
            />
          </>
        )}
      </div>

      {/* Bottom Toggle Button */}
      <div className="border-t border-slate-200/80 p-3 dark:border-slate-800">
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            'flex h-10 w-full items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer',
            open ? 'gap-3 px-3' : 'justify-center'
          )}
          title={open ? 'Réduire la barre latérale' : 'Agrandir la barre latérale'}
        >
          <ChevronsRight
            className={cn(
              'h-4 w-4 transition-transform duration-300',
              open && 'rotate-180'
            )}
          />
          {open && (
            <span className="text-xs font-semibold uppercase tracking-wider">
              Réduire le menu
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}

function SectionHeading({ label, open }: { label: string; open: boolean }) {
  if (!open) return null
  return (
    <div className="pt-4 pb-1.5 px-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
    </div>
  )
}

function NavItem({
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
        'group relative flex h-11 w-full items-center rounded-xl transition-all duration-200',
        open ? 'gap-3 px-3' : 'justify-center px-0',
        active
          ? 'bg-primary/10 text-primary font-semibold shadow-xs dark:bg-primary/20 dark:text-sky-300'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
      )}
    >
      <div className="grid h-full w-8 shrink-0 place-content-center">
        <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
      </div>
      {open && (
        <span className="text-sm truncate">
          {label}
        </span>
      )}
    </Link>
  )
}