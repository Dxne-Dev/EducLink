import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { GraduationCap, Clock, Building2, UserCircle } from 'lucide-react'
import { ProfileLayout } from '@/components/profile/ProfileLayout'
import { ProfileForm } from '@/components/profile/ProfileForm'

export const metadata = { title: 'Edulink - Profil Étudiant' }

export default async function StudentProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      full_name,
      role,
      filiere_id,
      niveau_id,
      promo_id,
      created_at,
      filieres(name, code),
      promotions(name, year_start, year_end, niveau_id, niveaux(name)),
      niveaux(name)
    `)
    .eq('id', user.id)
    .maybeSingle()

  const rawFiliere = profile?.filieres as unknown
  const filiereInfo = (Array.isArray(rawFiliere) ? rawFiliere[0] : rawFiliere) as { name: string; code: string } | null

  const rawPromo = profile?.promotions as any
  const promoInfo = (Array.isArray(rawPromo) ? rawPromo[0] : rawPromo) as {
    name: string
    year_start: number
    year_end: number
    niveaux?: { name: string }
  } | null

  const rawNiveau = profile?.niveaux as unknown
  const niveauInfo = promoInfo?.niveaux || ((Array.isArray(rawNiveau) ? rawNiveau[0] : rawNiveau) as { name: string } | null)

  const fullName = profile?.full_name || user.user_metadata?.full_name || 'Étudiant'
  const createdAt = profile?.created_at || user.created_at
  const initial = fullName.charAt(0).toUpperCase()

  return (
    <ProfileLayout
      breadcrumb={[{ label: 'Espace étudiant', href: '/etudiant/dashboard' }, { label: 'Mon profil' }]}
      heading="Mon profil"
      subtitle="Votre identité académique et vos informations de connexion."
      name={fullName}
      email={user.email ?? ''}
      initial={initial}
      metaLine={filiereInfo ? `${filiereInfo.name} (${filiereInfo.code})` : undefined}
      badges={
        <>
          {filiereInfo && (
            <Badge variant="purple" className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {filiereInfo.code || filiereInfo.name}
            </Badge>
          )}
          {niveauInfo && (
            <Badge variant="secondary" className="flex items-center gap-1 font-semibold text-primary">
              <Clock className="h-3 w-3" />
              {niveauInfo.name}
            </Badge>
          )}
          {promoInfo && (
            <Badge variant="default" className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {promoInfo.name}
            </Badge>
          )}
          <Badge variant="default" className="flex items-center gap-1">
            <UserCircle className="h-3 w-3" />
            Étudiant
          </Badge>
        </>
      }
      sectionsTitle="Informations académiques officielles"
      sectionsDescription="Ces données sont certifiées et verrouillées par l'administration universitaire."
      readOnly
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
              label: 'Email universitaire',
              value: <span className="font-mono">{user.email}</span>,
              hint: 'Identifiant de session officiel',
            },
          ],
        },
        {
          title: 'Parcours',
          fields: [
            {
              label: "Filière d'étude",
              value: filiereInfo ? `${filiereInfo.name} (${filiereInfo.code})` : 'Non assignée',
              hint: 'Cursus immuable',
            },
            {
              label: 'Niveau actuel',
              value: <span className="text-primary">{niveauInfo?.name || 'Non assigné'}</span>,
              hint: 'Année académique en cours',
            },
            {
              label: 'Promotion',
              value: promoInfo
                ? `${promoInfo.name} (${promoInfo.year_start}-${promoInfo.year_end})`
                : 'Promotion en cours de validation',
              hint: "Cohorte d'appartenance",
            },
            {
              label: "Date d'inscription",
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
      backHref="/etudiant/dashboard"
      backLabel="Retour au tableau de bord étudiant"
    />
  )
}