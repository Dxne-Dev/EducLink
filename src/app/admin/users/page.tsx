import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'
import { RoleSelect } from './role-select'
import { UserDeleteButton } from './user-delete-button'
import type { UserRole } from '@/types/database'
import { Users } from 'lucide-react'
import { ListPageShell } from '@/components/admin/ListPageShell'

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

  const breadcrumb = [
    { label: 'Administration', href: '/admin/dashboard' },
    { label: 'Utilisateurs' },
  ]

  return (
    <ListPageShell
      breadcrumb={breadcrumb}
      title="Utilisateurs"
      subtitle="Gérez les comptes, permissions et attributions de rôles de l'établissement"
      columns={[
        {
          header: 'Utilisateur',
          accessor: 'full_name',
          render: (value, row: any) => {
            const initial = (value || 'U').charAt(0).toUpperCase()
            return (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-amatry font-bold text-sm dark:bg-primary/20">
                  {initial}
                </div>
                <div>
                  <p className="font-semibold text-ink dark:text-slate-100">{value || 'Sans nom'}</p>
                  <p className="text-caption text-ink-faint font-mono">ID: {row.id.slice(0, 8)}...</p>
                </div>
              </div>
            )
          },
        },
        {
          header: 'Rôle actuel',
          accessor: 'role',
          className: 'w-36',
          render: (value: string) => {
            const roleKey = value as UserRole
            return (
              <Badge variant={roleBadge[roleKey] || 'default'} className="font-medium">
                {ROLE_LABELS[roleKey] || value}
              </Badge>
            )
          },
        },
        {
          header: 'Inscrit le',
          accessor: 'created_at',
          className: 'w-36',
          render: (value: string) => (
            <span className="text-caption text-ink-muted dark:text-slate-400">
              {formatDate(value)}
            </span>
          ),
        },
      ]}
      data={users ?? []}
      emptyState={{
        title: 'Aucun utilisateur',
        description: 'Les comptes créés apparaîtront ici.',
        icon: <Users className="h-8 w-8 text-ink-faint" />,
      }}
      renderActions={(u: any) => (
        <div className="flex items-center gap-2">
          <RoleSelect
            userId={u.id}
            role={u.role as UserRole}
            disabled={u.id === user?.id}
          />
          {u.id !== user?.id && <UserDeleteButton userId={u.id} />}
        </div>
      )}
    />
  )
}