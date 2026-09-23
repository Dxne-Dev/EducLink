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

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const supabase = createClient()
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(Boolean(session))
      if (session) {
        localStorage.setItem(STORAGE_KEY, String(Date.now()))
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session))
      if (session) {
        localStorage.setItem(STORAGE_KEY, String(Date.now()))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

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
