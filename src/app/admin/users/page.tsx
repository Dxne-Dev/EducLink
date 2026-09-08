import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'
import { RoleSelect } from './role-select'
import { UserDeleteButton } from './user-delete-button'
import type { UserRole } from '@/types/database'
import { Users } from 'lucide-react'

export const metadata = { title: 'Edulink - Utilisateurs' }

export default async function UsersAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .order('created_at', { ascending: false })

  const roleBadge: Record<UserRole, 'default' | 'success' | 'warning'> = {
    student: 'default',
    teacher: 'success',
    admin: 'warning',
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Utilisateurs</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Gérez les comptes et les rôles des utilisateurs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-title">Comptes</CardTitle>
          <CardDescription>{users?.length ?? 0} utilisateur(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <ul className="divide-y divide-hairline">
              {users.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink">{u.full_name}</p>
                      <Badge variant={roleBadge[u.role as UserRole]}>{ROLE_LABELS[u.role as UserRole]}</Badge>
                    </div>
                    <p className="mt-0.5 text-caption text-ink-faint">Inscrit le {formatDate(u.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RoleSelect userId={u.id} role={u.role as UserRole} disabled={u.id === user?.id} />
                    {u.id !== user?.id && <UserDeleteButton userId={u.id} />}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Users className="h-6 w-6 text-ink-faint" />}
              title="Aucun utilisateur"
              description="Les comptes créés apparaîtront ici."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}