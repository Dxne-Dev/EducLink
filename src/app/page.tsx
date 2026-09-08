'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { TESTIMONIALS } from '@/lib/testimonials'
import {
  BookOpen,
  Briefcase,
  FileText,
  FolderGit2,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid'

/* ── Données ───────────────────────────────────────────── */

const STATS = [
  { value: '100%', label: 'filières couvertes' },
  { value: '6', label: 'niveaux structurés' },
  { value: '7', label: 'matières référencées' },
  { value: '3', label: 'parcours actifs' },
]

const PROFILES = [
  {
    title: 'Étudiants',
    description: 'Accédez à vos cours, fiches et annales en un clic.',
    icon: BookOpen,
    color: 'text-[#62aef0]',
  },
  {
    title: 'Enseignants',
    description: 'Déposez et gérez vos ressources pour chaque matière.',
    icon: Users,
    color: 'text-[#2a9d99]',
  },
  {
    title: 'Administration',
    description: 'Supervisez, validez et pilotez la plateforme.',
    icon: ShieldCheck,
    color: 'text-[#dd5b00]',
  },
]

const CAPABILITIES = [
  {
    title: '100% de filières couvertes',
    description:
      'De la licence au master, chaque filière et niveau est référencé. Rien ne se perd.',
    Icon: FolderGit2,
    href: '/login',
    cta: 'Découvrir',
    className: 'lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3',
  },
  {
    title: 'Recherche intelligente',
    description:
      'Comprenez le langage naturel. Trouvez en un instant parmi des milliers de cours et ressources.',
    Icon: Search,
    href: '/login',
    cta: 'Explorer',
    className: 'lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3',
  },
  {
    title: 'Sécurité par défaut',
    description:
      'Chaque accès contrôlé par rôle. Vos données restent confidentielles et chiffrées.',
    Icon: ShieldCheck,
    href: '/login',
    cta: 'En savoir plus',
    className: 'lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4',
  },
  {
    title: 'Arborescence adaptée',
    description:
      'Classez par filière, niveau, matière et année. Dupliquez vos dossiers d\'une promotion à l\'autre.',
    Icon: Briefcase,
    href: '/login',
    cta: 'Voir la démo',
    className: 'lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2',
  },
  {
    title: 'Stage & insertion pro',
    description:
      'Banque de rapports validés, anonymisation automatique et trames officielles.',
    Icon: BookOpen,
    href: '/login',
    cta: 'Découvrir',
    className: 'lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4',
  },
]

/* ── Composants internes ───────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow-mint">{children}</span>
}

/* ── Page ──────────────────────────────────────────────── */

/** Mockup CSS-only d'interface de documentation */
function DocProductMockup() {
  const sidebarItems = [
    'Getting Started',
    'Cours & Ressources',
    'Stages',
    'Templates',
    'Recherche IA',
  ]
  const tocItems = ['Introduction', 'Upload', 'Organiser', 'Rechercher']
  const files = [
    { name: 'Examen Algorithmique S1 2024.pdf', level: 'Licence 2 Informatique' },
    { name: 'Fiche de Révision - BDD.pdf', level: 'Licence 1 Info' },
    { name: 'Rapport Stage - TechCorp.pdf', level: 'Master 1' },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-mist-gray bg-white shadow-mint-card">
      <div className="flex h-[320px]">
        {/* Sidebar */}
        <div className="hidden w-48 shrink-0 border-r border-mist-gray p-4 md:block">
          <p className="mb-4 text-[13px] font-semibold tracking-wide text-mint-green uppercase">
            Edulink Docs
          </p>
          <div className="space-y-0.5">
            {sidebarItems.map((item, i) => (
              <div
                key={item}
                className={`rounded px-3 py-1.5 text-[14px] ${
                  i === 1
                    ? 'bg-mint-tint font-medium text-mint-green'
                    : 'text-ink'
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 md:p-8">
          <p className="mb-1 text-[14px] text-ink-muted">Cours & Ressources</p>
          <h3 className="mb-4 text-[18px] font-semibold text-ink md:text-[20px]">
            Gérer vos supports de cours
          </h3>
          <div className="space-y-3">
            {files.map((f) => (
              <div
                key={f.name}
                className="flex items-center gap-3 rounded-lg border border-mist-gray p-3"
              >
                <FileText className="h-4 w-4 shrink-0 text-mint-green" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{f.name}</p>
                  <p className="text-[13px] text-ink-muted">{f.level}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOC */}
        <div className="hidden w-40 shrink-0 border-l border-mist-gray p-4 lg:block">
          <p className="mb-3 text-[13px] font-medium text-ink-muted">Sur cette page</p>
          <div className="space-y-2">
            {tocItems.map((item) => (
              <p key={item} className="text-[13px] text-ink">{item}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="font-sans">
      {/* ═══ NAV ═══ */}
      <header className="fixed top-0 z-50 w-full border-b border-transparent bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/android-chrome-192x192.png"
              alt="Edulink logo"
              className="h-8 w-8 rounded object-cover"
            />
            <span className="font-amatry text-xl tracking-wide text-ink-black">
              Edulink
            </span>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-[14px] font-medium text-ink md:flex">
            <a href="#features" className="transition-colors hover:text-mint-green">
              Fonctionnalités
            </a>
            <a href="#profiles" className="transition-colors hover:text-mint-green">
              Profils
            </a>
            <a href="#cta" className="transition-colors hover:text-mint-green">
              Commencer
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/login"
              className="rounded px-3 py-2 text-[14px] font-medium text-ink transition-colors hover:bg-mist-gray"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="rounded bg-ink-black px-4 py-2 text-[14px] font-medium text-white shadow-mint-sm transition-opacity hover:opacity-90"
            >
              Commencer
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ═══ HERO ═══ */}
        <section className="relative flex min-h-[500px] flex-col items-center justify-center overflow-hidden bg-mint-green px-6 pt-24 pb-32 md:min-h-[640px]">
          {/* Dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 text-center"
          >
            <h1 className="mx-auto max-w-3xl text-[32px] font-semibold leading-[1.1] tracking-[-1.14px] text-white sm:text-[40px] md:text-[57px]">
              Votre mémoire scolaire,{' '}
              <span className="font-serif italic">une seule vue.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-white/80 md:text-[18px]">
              Centralisez cours, fiches, annales et rapports de stage.
              Trouvez tout en un instant, sans effort.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-white px-6 py-3 text-[15px] font-medium text-ink-black shadow-mint-sm transition-opacity hover:opacity-90"
              >
                Commencer gratuitement
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/30 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
              >
                Se connecter
              </Link>
            </div>
          </motion.div>

          {/* Product mockup — chevauchement bas du hero */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative z-10 mt-16 w-full max-w-4xl px-4 md:px-0"
          >
            <DocProductMockup />
          </motion.div>
        </section>

        {/* ═══ STATS ═══ */}
        <section className="border-b border-mist-gray px-6 py-16">
          <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-[32px] font-semibold leading-[1.15] tracking-[-0.4px] text-ink md:text-[40px]">
                  {stat.value}
                </p>
                <p className="mt-1 text-[14px] text-ink-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ PROFILS ═══ */}
        <section id="profiles" className="px-6 py-20">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-12 text-center">
              <Eyebrow>Profils</Eyebrow>
              <h2 className="mt-4 text-[28px] font-semibold leading-[1.15] tracking-[-0.4px] text-ink md:text-[40px]">
                Pour chaque acteur du campus
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {PROFILES.map((p) => {
                const Icon = p.icon
                return (
                  <div
                    key={p.title}
                    className="rounded-2xl border border-mist-gray bg-white p-6"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-mist-gray">
                      <Icon className={`h-5 w-5 ${p.color}`} />
                    </div>
                    <h3 className="text-[20px] font-semibold text-ink">{p.title}</h3>
                    <p className="mt-2 text-[16px] leading-relaxed text-ink-muted">
                      {p.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ═══ TEMOIGNAGES (Marquee) ═══ */}
        <section className="overflow-hidden bg-mist-gray px-6 py-20">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-12 text-center">
              <Eyebrow>Témoignages</Eyebrow>
              <h2 className="mt-4 text-[28px] font-semibold leading-[1.15] tracking-[-0.4px] text-ink md:text-[40px]">
                Ils nous font confiance
              </h2>
            </div>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-mist-gray to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-mist-gray to-transparent" />
            <div className="marquee-track">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <div
                  key={`${t.name}-${i}`}
                  className="mx-3 w-[320px] shrink-0 rounded-2xl border border-mist-gray bg-white p-5"
                >
                  <p className="mb-3 text-[15px] leading-relaxed text-ink">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={t.avatar}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                      loading="lazy"
                    />
                    <div>
                      <p className="text-[14px] font-medium text-ink">{t.name}</p>
                      <p className="text-[13px] text-ink-muted">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FEATURE CAPABILITIES — Bento Grid ═══ */}
        <section id="features" className="px-6 py-20">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-12 text-center">
              <Eyebrow>Fonctionnalités</Eyebrow>
              <h2 className="mt-4 text-[28px] font-semibold leading-[1.15] tracking-[-0.4px] text-ink md:text-[40px]">
                Conçu pour l&apos;intelligence pédagogique
              </h2>
            </div>

            <BentoGrid className="lg:grid-rows-3">
              {CAPABILITIES.map((cap) => (
                <BentoCard
                  key={cap.title}
                  name={cap.title}
                  Icon={cap.Icon}
                  description={cap.description}
                  href={cap.href}
                  cta={cap.cta}
                  className={cap.className}
                  background={
                    <div className="absolute inset-0 flex items-center justify-center">
                      <cap.Icon className="h-32 w-32 text-mint-green/[.07]" />
                    </div>
                  }
                />
              ))}
            </BentoGrid>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section id="cta" className="px-6 py-20">
          <div className="mx-auto max-w-[1200px]">
            <div className="rounded-2xl border border-mist-gray bg-white p-8 text-center shadow-mint-card md:p-12">
              <h2 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.4px] text-ink md:text-[40px]">
                Commencez à structurer votre savoir
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[15px] text-ink md:text-[16px]">
                Rejoignez Edulink pour centraliser vos ressources pédagogiques.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Link
                  href="/signup"
                  className="rounded bg-ink-black px-6 py-3 text-[15px] font-medium text-white shadow-mint-sm transition-opacity hover:opacity-90"
                >
                  Créer un compte
                </Link>
                <Link
                  href="/login"
                  className="text-[15px] font-medium text-ink transition-colors hover:text-mint-green"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-mist-gray px-6 py-10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <img
              src="/android-chrome-192x192.png"
              alt="Edulink logo"
              className="h-6 w-6 rounded object-cover"
            />
            <span className="font-amatry text-lg text-ink-black">Edulink</span>
          </div>
          <p className="text-[13px] text-ink-muted">
            © {new Date().getFullYear()} Edulink. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  )
}
