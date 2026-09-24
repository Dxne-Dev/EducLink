import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface PageHeaderCrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  breadcrumb?: PageHeaderCrumb[]
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ breadcrumb, title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4', className)}>
      <div className="min-w-0 flex-1">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="breadcrumb" className="mb-1.5 overflow-x-auto">
            <ol className="flex flex-wrap items-center gap-1 text-caption text-ink-faint">
              {breadcrumb.map((crumb, index) => {
                const isLast = index === breadcrumb.length - 1
                return (
                  <li key={crumb.label + '-' + index} className="flex items-center gap-1 whitespace-nowrap">
                    {crumb.href && !isLast ? (
                      <Link href={crumb.href} className="transition-colors hover:text-ink">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={cn(isLast && 'font-medium text-ink-muted')}>{crumb.label}</span>
                    )}
                    {!isLast && <ChevronRight className="h-3 w-3" />}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-ink dark:text-white leading-snug">{title}</h1>
        {subtitle && <p className="mt-1 text-xs sm:text-sm text-ink-muted dark:text-slate-400 leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
