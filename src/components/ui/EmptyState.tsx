import { cn } from '@/lib/utils'
import { FileQuestion } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  iconBg?: string
}

function EmptyState({ icon, title, description, action, className, iconBg }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-14 px-4 text-center rounded-3xl border border-dashed border-hairline bg-canvas-soft/40 dark:border-slate-800/80 dark:bg-slate-900/30', className)}>
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-2xl shadow-xs transition-transform hover:scale-105',
          iconBg ?? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-300'
        )}
      >
        {icon ?? <FileQuestion className="h-8 w-8" />}
      </div>
      <h3 className="mt-4 text-lg font-bold text-ink dark:text-slate-100">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-muted dark:text-slate-400 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export { EmptyState }