// Témoignages partagés — utilisés par la landing page (carrousel) et les pages auth (panneau latéral)

export interface Testimonial {
  name: string
  role: string
  avatar: string
  quote: string
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Amira Bensalem',
    role: 'Directrice des études',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    quote: "Edulink a transformé la gestion de nos ressources. Tout est centralisé et retrouvable en un instant.",
  },
  {
    name: 'Karim Trabelsi',
    role: 'Étudiant · Licence Info',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    quote: "Je retrouve tous mes cours et annales en une seule recherche. Un gain de temps énorme.",
  },
  {
    name: 'Sophie Martin',
    role: 'Enseignante · Algorithmique',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    quote: "Réutiliser mes TP d'une promotion à l'autre est devenu un jeu d'enfant.",
  },
  {
    name: 'Yassine Ben Salah',
    role: 'Coordinateur pédagogique',
    avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
    quote: "La validation des rapports de stage est enfin centralisée et transparente.",
  },
  {
    name: 'Lina Haddad',
    role: 'Étudiante · Master',
    avatar: 'https://randomuser.me/api/portraits/women/79.jpg',
    quote: "Les exemples de rapports validés m'ont guidée pour rédiger le mien.",
  },
  {
    name: 'David Nguyen',
    role: 'Responsable entreprises',
    avatar: 'https://randomuser.me/api/portraits/men/85.jpg',
    quote: "En retrouvant les profils et rapports, on recrute mieux et plus vite.",
  },
]