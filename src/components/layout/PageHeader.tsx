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
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="breadcrumb" className="mb-1.5">
            <ol className="flex flex-wrap items-center gap-1 text-caption text-ink-faint">
              {breadcrumb.map((crumb, index) => {
                const isLast = index === breadcrumb.length - 1
                return (
                  <li key={crumb.label + '-' + index} className="flex items-center gap-1">
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
        <h1 className="text-heading-2 text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-body-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
