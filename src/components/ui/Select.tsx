import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-9 w-full appearance-none rounded-sm border border-[rgb(221,221,221)] bg-white px-3 py-1.5 pr-8 text-body-sm text-ink transition-all focus:border-primary focus:outline-none focus:shadow-level-1 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

export { Select }