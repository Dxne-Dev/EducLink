import { cn } from '@/lib/utils'
import { FileX } from 'lucide-react'

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
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div
        className={cn(
          'rounded-lg border border-dashed border-hairline p-3',
          iconBg ?? 'bg-canvas-soft'
        )}
      >
        {icon ?? <FileX className="h-6 w-6 text-ink-faint" />}
      </div>
      <h3 className="mt-4 text-heading-3 text-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-body-sm text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export { EmptyState }