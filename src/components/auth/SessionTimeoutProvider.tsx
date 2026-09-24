'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logout } from '@/lib/actions/auth.actions'

// Durée d'inactivité avant déconnexion automatique (30 minutes)
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000
// Fréquence de vérification du timer (toutes les 15 secondes)
const CHECK_INTERVAL_MS = 15 * 1000
// Throttle d'enregistrement de l'activité (10 secondes)
const THROTTLE_ACTIVITY_MS = 10 * 1000

const STORAGE_KEY = 'edulink_last_active_timestamp'

export function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const lastRecordedRef = useRef<number>(Date.now())
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  // Vérifier si l'utilisateur est connecté et synchroniser entre onglets
  useEffect(() => {
    const supabase = createClient()
    const isAuthOrRoot = pathname === '/' || pathname === '/login' || pathname === '/signup'

    async function syncAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      const hasSession = Boolean(session)
      setIsAuthenticated(hasSession)

      if (hasSession) {
        localStorage.setItem(STORAGE_KEY, String(Date.now()))
        // Si l'utilisateur est sur la page d'accueil ou de login et qu'une session existe, rediriger immédiatement
        if (isAuthOrRoot && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          const role = profile?.role || 'student'
          if (role === 'admin') router.replace('/admin/dashboard')
          else if (role === 'teacher') router.replace('/prof/dashboard')
          else router.replace('/etudiant/dashboard')
        }
      }
    }

    syncAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const hasSession = Boolean(session)
      setIsAuthenticated(hasSession)

      if (hasSession) {
        localStorage.setItem(STORAGE_KEY, String(Date.now()))
        if (isAuthOrRoot && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          const role = profile?.role || 'student'
          if (role === 'admin') router.replace('/admin/dashboard')
          else if (role === 'teacher') router.replace('/prof/dashboard')
          else router.replace('/etudiant/dashboard')
        }
      } else {
        localStorage.removeItem(STORAGE_KEY)
        if (!isAuthOrRoot && event === 'SIGNED_OUT') {
          router.replace('/login')
        }
      }
    })

    // Écouteur inter-onglets (storage event)
    function handleStorageChange(e: StorageEvent) {
      if (e.key === STORAGE_KEY || e.key?.includes('auth-token') || e.key?.includes('supabase')) {
        syncAuth()
      }
    }

    // Écouteur de retour au premier plan (onglet réactivé)
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        syncAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pathname, router])

  // Déconnexion automatique en cas d'inactivité
  const handleTimeoutLogout = useCallback(async () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      const supabase = createClient()
      await supabase.auth.signOut()
      try {
        await logout()
      } catch {
        // Redirection handled
      }
    } finally {
      setIsAuthenticated(false)
      router.push('/login?reason=inactivity')
      router.refresh()
    }
  }, [router])

  // Enregistrer l'activité utilisateur (throttled)
  const recordActivity = useCallback(() => {
    const now = Date.now()
    if (now - lastRecordedRef.current > THROTTLE_ACTIVITY_MS) {
      lastRecordedRef.current = now
      localStorage.setItem(STORAGE_KEY, String(now))
    }
  }, [])

  useEffect(() => {
    // Si pas authentifié ou sur les pages d'auth, ne pas suivre l'inactivité
    const isAuthRoute = pathname === '/login' || pathname === '/signup' || pathname === '/reset-password'
    if (!isAuthenticated || isAuthRoute) {
      return
    }

    // Événements surveillés
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }))

    // Initialiser le timestamp d'activité
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    lastRecordedRef.current = Date.now()

    // Vérification périodique du temps écoulé
    const interval = setInterval(() => {
      const stored = localStorage.getItem(STORAGE_KEY)
      const lastActive = stored ? parseInt(stored, 10) : lastRecordedRef.current
      const now = Date.now()

      if (now - lastActive > INACTIVITY_TIMEOUT_MS) {
        clearInterval(interval)
        handleTimeoutLogout()
      }
    }, CHECK_INTERVAL_MS)

    return () => {
      events.forEach((event) => window.removeEventListener(event, recordActivity))
      clearInterval(interval)
    }
  }, [isAuthenticated, pathname, recordActivity, handleTimeoutLogout])

  return <>{children}</>
}
