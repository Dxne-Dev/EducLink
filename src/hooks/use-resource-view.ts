'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useResourceView() {
  const supabase = createClient()

  const logView = useCallback(async (resourceId: string, action: string = 'view') => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/log-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ resource_id: resourceId, action }),
      })
    } catch {
      /* fallback silencieux */
    }
  }, [supabase])

  return { logView }
}