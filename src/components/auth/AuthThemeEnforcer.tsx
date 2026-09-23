'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { ThemeProvider } from '@/components/theme-provider'

export function AuthThemeEnforcer({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme()

  useEffect(() => {
    // Forcer le thème clair sur les pages d'authentification
    setTheme('light')
    document.documentElement.classList.remove('dark')
  }, [setTheme])

  return (
    <ThemeProvider forcedTheme="light" attribute="class" enableSystem={false}>
      <div className="min-h-screen bg-white text-ink antialiased">
        {children}
      </div>
    </ThemeProvider>
  )
}
