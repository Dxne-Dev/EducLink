import { cn } from '@/lib/utils'

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'text-body-sm font-medium leading-none text-ink-secondary',
        className
      )}
      {...props}
    />
  )
}

export { Label }