'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'danger' | 'warning' | 'info'

export interface ToastItem {
  id: string
  title: string
  description?: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  showToast: (title: string, options?: { description?: string; type?: ToastType; duration?: number }) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let globalToastHandler: ((item: ToastItem) => void) | null = null

/** Fonction globale utilisable partout : toast.success("Message", "Détail") */
export const toast = {
  success: (title: string, description?: string) => {
    globalToastHandler?.({
      id: Math.random().toString(36).substring(2, 9),
      title,
      description,
      type: 'success',
    })
  },
  error: (title: string, description?: string) => {
    globalToastHandler?.({
      id: Math.random().toString(36).substring(2, 9),
      title,
      description,
      type: 'danger',
    })
  },
  warning: (title: string, description?: string) => {
    globalToastHandler?.({
      id: Math.random().toString(36).substring(2, 9),
      title,
      description,
      type: 'warning',
    })
  },
  info: (title: string, description?: string) => {
    globalToastHandler?.({
      id: Math.random().toString(36).substring(2, 9),
      title,
      description,
      type: 'info',
    })
  },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((item: ToastItem) => {
    setToasts((prev) => [...prev, item])
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== item.id))
    }, item.duration || 4500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    globalToastHandler = addToast
    return () => {
      globalToastHandler = null
    }
  }, [addToast])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const value: ToastContextValue = {
    showToast: (title, options) => {
      addToast({
        id: Math.random().toString(36).substring(2, 9),
        title,
        description: options?.description,
        type: options?.type || 'info',
        duration: options?.duration,
      })
    },
    success: (title, description) => toast.success(title, description),
    error: (title, description) => toast.error(title, description),
    warning: (title, description) => toast.warning(title, description),
    info: (title, description) => toast.info(title, description),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container Floating Top-Right */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => {
            const IconComponent =
              t.type === 'success'
                ? CheckCircle2
                : t.type === 'danger'
                ? AlertCircle
                : t.type === 'warning'
                ? AlertTriangle
                : Info

            const typeStyles = {
              success: 'border-emerald-500/30 bg-white/95 dark:bg-slate-900/95 text-emerald-700 dark:text-emerald-400',
              danger: 'border-red-500/30 bg-white/95 dark:bg-slate-900/95 text-red-700 dark:text-red-400',
              warning: 'border-amber-500/30 bg-white/95 dark:bg-slate-900/95 text-amber-700 dark:text-amber-400',
              info: 'border-primary/30 bg-white/95 dark:bg-slate-900/95 text-primary dark:text-sky-300',
            }[t.type]

            const iconBg = {
              success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
              danger: 'bg-red-500/15 text-red-600 dark:text-red-400',
              warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
              info: 'bg-primary/15 text-primary dark:text-sky-300',
            }[t.type]

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={cn(
                  'pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all',
                  typeStyles
                )}
              >
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', iconBg)}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
