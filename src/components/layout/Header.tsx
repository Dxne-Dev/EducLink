'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logout } from '@/lib/actions/auth.actions'
import { LogOut, User, Sparkles, Shield, GraduationCap, BookOpen, Loader2 } from 'lucide-react'
import { MobileNav } from './MobileNav'
import { ThemeToggle } from './ThemeToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface HeaderProps {
  fullName?: string
  role?: string
}

export function Header({ fullName, role }: HeaderProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const isStudent = role === 'student'
  const isTeacher = role === 'teacher'
  const isAdmin = role === 'admin'

  const roleLabel = isAdmin
    ? 'Administrateur'
    : isTeacher
    ? 'Enseignant'
    : 'Étudiant'

  const profileHref = isAdmin
    ? '/admin/profile'
    : isTeacher
    ? '/prof/profile'
    : '/etudiant/profile'

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  async function handleLogout() {
    if (loggingOut) return
    try {
      setLoggingOut(true)
      const supabase = createClient()
      await supabase.auth.signOut()
      try {
        await logout()
      } catch {
        // Redirection handled
      }
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
      {/* Left side: Mobile navigation & Brand/Title */}
      <div className="flex items-center gap-3">
        <MobileNav role={role} />
        
        <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 sm:flex">
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary dark:bg-primary/20 dark:text-sky-300 font-semibold">
            {isAdmin ? <Shield className="h-3.5 w-3.5" /> : isTeacher ? <BookOpen className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Right side: Actions, Theme switcher & User Menu */}
      <div className="flex items-center gap-3">
        {/* Dark / Light mode toggle */}
        <ThemeToggle />

        {/* Profile Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-full p-1 transition-colors hover:bg-slate-100 focus:outline-none dark:hover:bg-slate-800 cursor-pointer"
            >
              <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700 bg-gradient-to-tr from-primary to-secondary text-white font-semibold shadow-xs">
                <AvatarFallback className="bg-primary/20 text-primary dark:bg-primary/30 dark:text-sky-200 text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                  {fullName || 'Mon Compte'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {roleLabel}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-xl border border-slate-200 p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <DropdownMenuLabel className="px-2 py-1.5">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{fullName}</p>
              <p className="text-xs font-normal text-slate-500 dark:text-slate-400">{roleLabel}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
            
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  href={profileHref}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  <span>Mon Profil</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                handleLogout()
              }}
              disabled={loggingOut}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950/40"
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin text-red-600" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span>{loggingOut ? 'Déconnexion…' : 'Se déconnecter'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}