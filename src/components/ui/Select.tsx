import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, value, children, ...props }, ref) => {
    // When value is empty string (placeholder), render placeholder colour
    const isEmpty = value === '' || value === undefined || value === null
    return (
      <select
        value={value}
        className={cn(
          'flex h-9 w-full appearance-none rounded-sm border border-[rgb(221,221,221)] bg-white px-3 py-1.5 text-body-sm transition-all focus:border-primary focus:outline-none focus:shadow-level-1 disabled:cursor-not-allowed disabled:opacity-50',
          isEmpty ? 'text-ink-faint' : 'text-ink',
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