import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

interface AuthCardProps {
  title: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/** Coque de formulaire auth — colonne gauche du split-screen */
function AuthCard({ title, description, footer, children, className }: AuthCardProps) {
  return (
    <div className={cn('w-full', className)}>
      <Link
        href="/"
        className="auth-anim-element auth-delay-100 mb-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>
      <h1 className="auth-anim-element auth-delay-200 text-3xl font-semibold leading-tight tracking-tighter text-ink md:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="auth-anim-element auth-delay-300 mt-3 text-body-sm text-ink-muted">
          {description}
        </p>
      )}
      <div className="mt-9">{children}</div>
      {footer && (
        <div className="mt-8 text-center text-body-sm text-ink-muted">{footer}</div>
      )}
    </div>
  )
}

/** Wrapper input "glass" — light, hairline, focus ring primary (style sign-in.tsx) */
function GlassInput({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-hairline bg-white shadow-level-1 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
      {children}
    </div>
  )
}

export { AuthCard, GlassInput }