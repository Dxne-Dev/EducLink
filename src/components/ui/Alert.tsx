import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-md border p-4 text-body-sm',
  {
    variants: {
      variant: {
        // Statut porté par la palette sticker (spec Notion)
        default: 'border-hairline bg-white text-ink-secondary dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200',
        success: 'border-success/25 bg-success/10 text-success dark:bg-emerald-950/30 dark:border-emerald-800/40',
        warning: 'border-warning/25 bg-warning/10 text-warning dark:bg-amber-950/30 dark:border-amber-800/40',
        danger: 'border-danger/25 bg-danger/10 text-danger dark:bg-red-950/30 dark:border-red-800/40',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  )
}

export { Alert, alertVariants }