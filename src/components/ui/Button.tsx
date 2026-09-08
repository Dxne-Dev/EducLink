import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Pill CTA bleu — le seul bouton coloré de la page
        primary:
          'bg-primary text-white rounded hover:active:scale-[0.97] shadow-level-1',
        // Pill blanc avec ombre — CTA secondaire
        secondary:
          'bg-white text-ink rounded border border-hairline shadow-level-1 hover:shadow-level-2',
        // Bouton utilitaire — radius serré 4px, bordure hairline
        utility:
          'bg-white text-ink rounded border border-hairline text-body-sm',
        // Lien texte bleu
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
        // Ghost — transparent
        ghost: 'text-ink-secondary hover:bg-canvas-soft rounded',
        // Danger
        danger: 'bg-danger text-white rounded shadow-level-1',
      },
      size: {
        sm: 'h-8 px-3 text-body-sm',
        md: 'h-10 px-5 text-body-md',
        lg: 'h-12 px-8 text-body-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  icon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : icon ? (
          <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }