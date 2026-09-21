'use client'

import { useResourceView } from '@/hooks/use-resource-view'

interface ResourceViewLoggerProps {
  resourceId: string
  children: React.ReactNode
  action?: string
}

export function ResourceViewLogger({
  resourceId,
  children,
  action = 'view',
}: ResourceViewLoggerProps) {
  const { logView } = useResourceView()

  const handleClick = () => {
    logView(resourceId, action)
  }

  return (
    <span onClick={handleClick}>
      {children}
    </span>
  )
}