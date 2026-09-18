'use client'

import { useState, useTransition, useEffect } from 'react'
import { updateUserRole } from '@/lib/actions/user.actions'
import { Select } from '@/components/ui/Select'
import { ROLE_LABELS } from '@/lib/constants'
import type { UserRole } from '@/types/database'

const ROLES: UserRole[] = ['student', 'teacher', 'admin']

export function RoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string
  role: UserRole
  disabled?: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [current, setCurrent] = useState(role)

  useEffect(() => {
    setCurrent(role)
  }, [role])

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as UserRole
    setCurrent(next)
    startTransition(async () => {
      const res = await updateUserRole(userId, next)
      if (res?.error) setCurrent(role)
    })
  }

  return (
    <Select
      className="w-36"
      value={current}
      onChange={handleChange}
      disabled={disabled || pending}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
      ))}
    </Select>
  )
}
