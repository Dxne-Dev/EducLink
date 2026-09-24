import * as React from "react"
import { cn } from "@/lib/utils"

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

export const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(
          "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border/80 bg-muted/60 px-1.5 font-mono text-[11px] font-semibold text-muted-foreground shadow-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400",
          className
        )}
        {...props}
      />
    )
  }
)
Kbd.displayName = "Kbd"
