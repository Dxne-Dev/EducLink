'use client'

import * as React from 'react'
import { Icon as IconifyIcon } from '@iconify/react'
import { cn } from '@/lib/utils'

export interface IconProps {
  name: string
  className?: string
  style?: React.CSSProperties
}

export function Icon({ name, className, style }: IconProps) {
  return (
    <IconifyIcon
      icon={name}
      className={cn('inline-block shrink-0', className)}
      style={style}
    />
  )
}
