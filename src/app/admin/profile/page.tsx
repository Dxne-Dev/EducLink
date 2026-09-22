import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { UserCircle } from 'lucide-react'
import { ProfileLayout } from '@/components/profile/ProfileLayout'
import { ProfileForm } from '@/components/profile/ProfileForm'

export const metadata = { title: 'Edulink - Profil Administrateur' }

export default async function AdminProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, created_at')
    .eq('id', user.id)
    .maybeSingle()

  const fullName = profile?.full_name || user.user_metadata?.full_name || 'Administrateur'
  const createdAt = profile?.created_at || user.created_at
  const initial = fullName.charAt(0).toUpperCase()

  return (
    <ProfileLayout
      breadcrumb={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Mon profil' }]}
      heading="Mon profil"
      subtitle="Votre identité de gestionnaire et vos informations de connexion."
      name={fullName}
      email={user.email ?? ''}
      initial={initial}
      badges={
        <Badge variant="purple" className="flex items-center gap-1 font-semibold">
          <UserCircle className="h-3 w-3" />
          Administrateur
        </Badge>
      }
      sectionsTitle="Informations du compte"
      sectionsDescription="Ces informations proviennent du registre officiel administré par l'établissement."
      readOnly
      readOnlyLabel="Compte privilégié"
      sections={[
        {
          title: 'Identité',
          fields: [
            {
              label: 'Nom & Prénom',
              value: fullName,
              hint: 'Identité déclarée au registre',
            },
            {
              label: 'Email administratif',
              value: <span className="font-mono">{user.email}</span>,
              hint: 'Identifiant de session officiel',
            },
          ],
        },
        {
          title: 'Compte',
          fields: [
            {
              label: 'Rôle',
              value: <span className="text-primary">Administration</span>,
              hint: 'Accès complet à la plateforme',
            },
            {
              label: "Date d'enregistrement",
              value: new Date(createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              hint: "Date d'ouverture du compte",
            },
          ],
        },
      ]}
      extraContent={<ProfileForm />}
      backHref="/admin/dashboard"
      backLabel="Retour au tableau de bord administrateur"
    />
  )
}