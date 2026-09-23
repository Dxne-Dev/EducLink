'use client'

import { useState } from 'react'
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
  UserCheck,
  Award,
  UserCircle,
  Library,
  Upload,
  X,
  Menu,
} from 'lucide-react'

interface MobileNavProps {
  role?: string
}

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isStudent = role === 'student'
  const isTeacher = role === 'teacher'
  const isAdmin = role === 'admin'

  const homeHref = isAdmin ? '/admin/dashboard' : isTeacher ? '/prof/dashboard' : '/etudiant/dashboard'

  const close = () => setOpen(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden inline-flex items-center justify-center rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        aria-label="Ouvrir la navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={close} />
          
          <div className="fixed inset-y-0 left-0 flex w-72 max-w-full flex-col bg-white shadow-2xl dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 animate-slide-up">
            {/* Mobile Header */}
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
              <Link href={homeHref} onClick={close} className="flex items-center gap-2.5">
                <div className="grid size-8 place-content-center rounded-lg bg-gradient-to-tr from-primary to-secondary text-white font-bold">
                  <img src="/android-chrome-192x192.png" alt="" className="h-5 w-5 rounded object-cover" />
                </div>
                <span className="font-amatry text-xl tracking-wide text-slate-900 dark:text-white">Edulink</span>
              </Link>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
              <MobileNavOption
                href={homeHref}
                icon={LayoutDashboard}
                label="Tableau de bord"
                onClick={close}
                active={isAdmin ? pathname === '/admin/dashboard' || pathname === '/admin' : isTeacher ? pathname === '/prof/dashboard' : pathname === '/etudiant/dashboard' || pathname === '/dashboard'}
              />

              {isStudent && (
                <>
                  <MobileNavSection label="Ma filière" />
                  <MobileNavOption href="/etudiant/profs" icon={UserCheck} label="Mes profs" onClick={close} active={pathname === '/etudiant/profs' || pathname === '/dashboard/profs'} />
                  <MobileNavOption href="/etudiant/ressources" icon={BookOpen} label="Mes ressources" onClick={close} active={pathname === '/etudiant/ressources' || pathname === '/dashboard/ressources'} />

                  <MobileNavSection label="Général" />
                  <MobileNavOption href="/etudiant/stages" icon={Briefcase} label="Stages & Gabarits" onClick={close} active={pathname === '/etudiant/stages' || pathname === '/dashboard/stages'} />
                  <MobileNavOption href="/etudiant/profile" icon={UserCircle} label="Mon Profil" onClick={close} active={pathname === '/etudiant/profile'} />
                </>
              )}

              {isTeacher && (
                <>
                  <MobileNavSection label="Enseignement" />
                  <MobileNavOption href="/prof/mes-cours" icon={Library} label="Ma Bibliothèque" onClick={close} active={pathname.startsWith('/prof/mes-cours') || pathname.startsWith('/dashboard/mes-cours')} />
                  <MobileNavOption href="/prof/cours/upload" icon={Upload} label="Publier un cours" onClick={close} active={pathname === '/prof/cours/upload' || pathname === '/dashboard/cours/upload'} />
                  <MobileNavOption href="/prof/matieres" icon={BookMarked} label="Mes Matières" onClick={close} active={pathname === '/prof/matieres' || pathname === '/dashboard/matieres'} />
                  <MobileNavOption href="/prof/profile" icon={UserCircle} label="Mon Profil" onClick={close} active={pathname === '/prof/profile'} />
                </>
              )}

              {isAdmin && (
                <>
                  <MobileNavSection label="Administration" />
                  <MobileNavOption href="/admin/filieres" icon={GraduationCap} label="Filières" onClick={close} active={pathname === '/admin/filieres'} />
                  <MobileNavOption href="/admin/matieres" icon={BookMarked} label="Matières & Niveaux" onClick={close} active={pathname === '/admin/matieres'} />
                  <MobileNavOption href="/admin/promotions" icon={Building2} label="Promotions" onClick={close} active={pathname === '/admin/promotions'} />
                  <MobileNavOption href="/admin/users" icon={Users} label="Utilisateurs" onClick={close} active={pathname === '/admin/users'} />
                  <MobileNavOption href="/admin/teachers" icon={Award} label="Enseignants & Matières" onClick={close} active={pathname.startsWith('/admin/teachers')} />
                  <MobileNavOption href="/admin/rapports" icon={ClipboardList} label="Stages & Gabarits" onClick={close} active={pathname === '/admin/rapports'} />
                  <MobileNavOption href="/admin/profile" icon={UserCircle} label="Mon Profil" onClick={close} active={pathname === '/admin/profile'} />
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

function MobileNavOption({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string
  icon: React.ElementType
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/10 text-primary font-semibold dark:bg-primary/20 dark:text-sky-300'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  )
}

function MobileNavSection({ label }: { label: string }) {
  return (
    <div className="pt-3 pb-1 px-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
    </div>
  )
}