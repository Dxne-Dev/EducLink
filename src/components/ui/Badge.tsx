import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  // badge-pill : coque blanche, texte primaire, eyebrow 12px/600, pleine pilule
  'inline-flex items-center gap-1 rounded-full whitespace-nowrap text-eyebrow',
  {
    variants: {
      variant: {
        // Eyebrow classique : blanc + texte bleu primaire
        default: 'bg-white text-primary border border-hairline px-2 py-0.5 dark:bg-slate-900 dark:border-slate-800 dark:text-sky-300',
        success: 'bg-success/15 text-success px-2 py-0.5 dark:bg-emerald-950/40 dark:text-emerald-300',
        warning: 'bg-warning/15 text-[var(--color-orange-deep)] px-2 py-0.5 dark:bg-amber-950/40 dark:text-amber-300',
        danger: 'bg-danger/15 text-danger px-2 py-0.5 dark:bg-red-950/40 dark:text-red-300',
        // Tuile sticker déco
        purple: 'bg-accent-purple/25 text-accent-purple-deep px-2 py-0.5 dark:bg-purple-950/40 dark:text-purple-300',
        teal: 'bg-accent-teal/15 text-accent-teal px-2 py-0.5 dark:bg-teal-950/40 dark:text-teal-300',
        pink: 'bg-accent-pink/15 text-accent-pink px-2 py-0.5 dark:bg-pink-950/40 dark:text-pink-300',
        secondary: 'bg-canvas-soft text-ink-muted px-2 py-0.5 dark:bg-slate-800 dark:text-slate-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }