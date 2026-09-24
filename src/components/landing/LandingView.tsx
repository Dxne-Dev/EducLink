'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { TESTIMONIALS } from '@/lib/testimonials'
import {
  BookOpen,
  Briefcase,
  FileText,
  FolderGit2,
  Search,
  ShieldCheck,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Layers,
  Lock,
  Menu,
  X,
} from 'lucide-react'
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid'

/* ── Données ───────────────────────────────────────────── */

const STATS = [
  { value: '100%', label: 'Filières & Niveaux couverts', change: 'Complet' },
  { value: '6', label: 'Niveaux académiques structurés', change: 'L1 à M2' },
  { value: '1000+', label: 'Ressources & Cours hébergés', change: 'Actifs' },
  { value: '100%', label: 'Contrôle d\'accès sécurisé', change: 'Certifié' },
]

const PROFILES = [
  {
    title: 'Étudiants',
    description: 'Accédez instantanément à vos cours, fiches de révision et annales d\'examens sans jamais vous perdre.',
    icon: GraduationCap,
    color: 'text-primary bg-primary/10 border-primary/20',
    features: ['Recherche par langage naturel', 'Annales & examens récents', 'Templates de rapports de stage'],
  },
  {
    title: 'Enseignants',
    description: 'Déposez, organisez et partagez vos supports pédagogiques en quelques clics par promotion.',
    icon: Users,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    features: ['Upload rapide & multipages', 'Partage ciblé par matière', 'Gestion des fiches de TD/TP'],
  },
  {
    title: 'Administration',
    description: 'Supervisez l\'ensemble du campus, pilotez les promotions et gérez les droits en toute simplicité.',
    icon: ShieldCheck,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    features: ['Registre des professeurs', 'Configuration des filières', 'Contrôle granulaire RLS'],
  },
]

const CAPABILITIES = [
  {
    title: '100% de filières couvertes',
    description:
      'De la licence au master, chaque filière et niveau est référencé et synchronisé.',
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
      {children}
    </span>
  )
}

function DocProductMockup() {
  const sidebarItems = [
    { label: 'Cours & Ressources', active: true, count: '24' },
    { label: 'Fiches de TD / TP', active: false, count: '12' },
    { label: 'Annales d\'examens', active: false, count: '8' },
    { label: 'Rapports de Stage', active: false, count: '15' },
  ]
  const files = [
    { name: 'Algorithmique Avancée & Graphes.pdf', level: 'Licence 3 Informatique', prof: 'Dr. Martin', tag: 'Cours', tagColor: 'bg-primary/10 text-primary' },
    { name: 'Architecture BDD & PostgreSQL.pdf', level: 'Licence 2 Info', prof: 'Pr. Dubois', tag: 'TD/TP', tagColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { name: 'Rapport Stage - Data Engineering.pdf', level: 'Master 1 SI', prof: 'Dr. Lambert', tag: 'Stage', tagColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  ]

  return (
    <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/95 dark:bg-charcoal-card/95 shadow-2xl backdrop-blur-xl">
      <div className="flex h-11 items-center justify-between border-b border-hairline bg-canvas-soft/80 px-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-400/80" />
          <div className="h-3 w-3 rounded-full bg-amber-400/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-xs font-medium text-ink-muted">Edulink Campus — Espace Numérique de Travail</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Lock className="h-3 w-3 text-emerald-500" />
          <span>Session Sécurisée SSL</span>
        </div>
      </div>

      <div className="flex h-[360px]">
        <div className="hidden w-56 shrink-0 border-r border-hairline bg-canvas-soft/40 p-4 md:block">
          <div className="mb-4 flex items-center gap-2 px-2">
            <Layers className="h-4 w-4 text-primary" />
            <p className="text-xs font-bold tracking-wider text-ink uppercase">
              Bibliothèque
            </p>
          </div>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
                  item.active
                    ? 'bg-primary text-white font-medium shadow-sm'
                    : 'text-ink-secondary hover:bg-canvas-soft'
                }`}
              >
                <span>{item.label}</span>
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${item.active ? 'bg-white/20 text-white' : 'bg-canvas-soft text-ink-muted'}`}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-primary uppercase">Licence & Master</p>
              <h3 className="text-base font-semibold text-ink md:text-lg">
                Derniers documents publiés
              </h3>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              ● En ligne
            </span>
          </div>

          <div className="space-y-3">
            {files.map((f) => (
              <div
                key={f.name}
                className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-white dark:bg-charcoal/50 p-3.5 shadow-level-1 transition-all hover:border-primary/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink">{f.name}</p>
                    <p className="text-[11px] text-ink-muted">{f.level} • {f.prof}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${f.tagColor}`}>
                  {f.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LandingView() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMobileMenuOpen(false)
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKeyDown)
      }
    } else {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="fixed top-0 z-50 w-full border-b border-hairline bg-white/85 dark:bg-charcoal/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/android-chrome-192x192.png"
              alt="Edulink logo"
              className="h-9 w-9 rounded-xl object-cover shadow-sm"
            />
            <span className="font-amatry text-2xl tracking-wide text-ink">
              Edulink
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-ink-secondary md:flex">
            <a href="#features" className="transition-colors hover:text-primary">
              Fonctionnalités
            </a>
            <a href="#profiles" className="transition-colors hover:text-primary">
              Profils
            </a>
            <a href="#testimonials" className="transition-colors hover:text-primary">
              Avis
            </a>
            <a href="#cta" className="transition-colors hover:text-primary">
              Commencer
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex rounded-full px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-canvas-soft hover:text-ink"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-primary px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium text-white shadow-level-1 transition-all duration-150 hover:bg-primary-active hover:shadow-level-2 active:scale-95"
            >
              Créer un compte
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden inline-flex items-center justify-center rounded-xl p-2 text-ink-secondary hover:bg-canvas-soft transition-colors cursor-pointer"
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation for Landing */}
      {mounted &&
        createPortal(
          <div
            className={`fixed inset-0 z-[999] md:hidden transition-all duration-300 ${
              mobileMenuOpen ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'
            }`}
            role="dialog"
            aria-modal="true"
          >
            <div
              className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
                mobileMenuOpen ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={closeMenu}
            />

            <div
              className={`fixed inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 ${
                mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <img src="/android-chrome-192x192.png" alt="" className="h-7 w-7 rounded-lg object-cover shadow-xs" />
                  <span className="font-amatry text-xl tracking-wide text-slate-900 dark:text-white">Edulink</span>
                </div>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="Fermer le menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <nav className="space-y-2">
                  <a
                    href="#features"
                    onClick={closeMenu}
                    className="flex items-center rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    Fonctionnalités
                  </a>
                  <a
                    href="#profiles"
                    onClick={closeMenu}
                    className="flex items-center rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    Profils (Étudiants & Profs)
                  </a>
                  <a
                    href="#testimonials"
                    onClick={closeMenu}
                    className="flex items-center rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    Avis d'utilisateurs
                  </a>
                  <a
                    href="#cta"
                    onClick={closeMenu}
                    className="flex items-center rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    Commencer
                  </a>
                </nav>

                <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="flex w-full items-center justify-center rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/signup"
                    onClick={closeMenu}
                    className="flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-active transition-colors"
                  >
                    Créer un compte
                  </Link>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      <main>
        <section className="relative flex min-h-[640px] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0c8c5e] via-[#09734d] to-[#04482e] px-6 pt-28 pb-36 text-white md:min-h-[720px]">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[700px] rounded-full bg-emerald-400/20 blur-3xl" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 max-w-4xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
              <span>Plateforme académique nouvelle génération</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Votre mémoire scolaire,{' '}
              <span className="font-serif italic font-normal text-emerald-200">une seule vue.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg md:text-xl">
              Centralisez cours, fiches, annales et rapports de stage.
              Trouvez tout en un instant grâce à une recherche intelligente.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/signup"
                className="flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#065338] shadow-level-2 transition-all hover:bg-white/95 hover:scale-105 active:scale-95"
              >
                <span>Commencer gratuitement</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
              >
                Se connecter
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative z-10 mt-16 w-full max-w-4xl px-2 sm:px-4"
          >
            <DocProductMockup />
          </motion.div>
        </section>

        <section className="relative z-20 -mt-10 px-6">
          <div className="mx-auto max-w-6xl rounded-3xl border border-hairline bg-white/90 dark:bg-charcoal-card/90 p-8 shadow-level-2 backdrop-blur-xl md:p-10">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center md:text-left">
                  <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {stat.change}
                  </span>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="profiles" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 text-center">
              <Eyebrow>Profils</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
                Conçu pour chaque acteur du campus
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-base text-ink-muted">
                Une expérience personnalisée selon votre rôle et vos besoins pédagogiques.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {PROFILES.map((p) => {
                const Icon = p.icon
                return (
                  <div
                    key={p.title}
                    className="flex flex-col justify-between rounded-3xl border border-hairline bg-white dark:bg-charcoal-card p-8 shadow-level-1 transition-all duration-200 hover:-translate-y-1 hover:shadow-level-2"
                  >
                    <div>
                      <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border ${p.color}`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-xl font-bold text-ink">{p.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                        {p.description}
                      </p>
                    </div>

                    <div className="mt-8 border-t border-hairline pt-6 space-y-2.5">
                      {p.features.map((f) => (
                        <div key={f} className="flex items-center gap-2.5 text-xs font-medium text-ink-secondary">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section id="testimonials" className="overflow-hidden border-y border-hairline bg-canvas-soft/60 px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 text-center">
              <Eyebrow>Témoignages</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
                Adopté par les universités & grandes écoles
              </h2>
            </div>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-canvas to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-canvas to-transparent" />
            <div className="marquee-track">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <div
                  key={`${t.name}-${i}`}
                  className="mx-4 w-80 shrink-0 rounded-3xl border border-hairline bg-white dark:bg-charcoal-card p-6 shadow-level-1 transition-transform hover:scale-[1.02]"
                >
                  <p className="mb-4 text-sm leading-relaxed text-ink-secondary">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 border-t border-hairline pt-4">
                    <img
                      src={t.avatar}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20"
                      loading="lazy"
                    />
                    <div>
                      <p className="text-xs font-bold text-ink">{t.name}</p>
                      <p className="text-[11px] text-ink-muted">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 text-center">
              <Eyebrow>Fonctionnalités clés</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
                L&apos;intelligence au service de vos études
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-base text-ink-muted">
                Chaque module est pensé pour éliminer la friction et accélérer l&apos;apprentissage.
              </p>
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
                    <div className="absolute inset-0 flex items-center justify-center opacity-40">
                      <cap.Icon className="h-40 w-40 text-primary/10" />
                    </div>
                  }
                />
              ))}
            </BentoGrid>
          </div>
        </section>

        <section id="cta" className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-r from-primary/10 via-emerald-500/10 to-teal-500/10 p-10 text-center shadow-level-2 dark:border-primary/40 md:p-16">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

              <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
                Prêt à moderniser votre campus ?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-ink-secondary md:text-lg">
                Rejoignez dès maintenant étudiants et enseignants sur Edulink pour organiser vos ressources pédagogiques.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/signup"
                  className="rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-level-1 transition-all hover:bg-primary-active hover:shadow-level-2 active:scale-95"
                >
                  Créer un compte gratuitement
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-hairline bg-white dark:bg-charcoal-card px-8 py-3.5 text-sm font-semibold text-ink shadow-sm transition-all hover:bg-canvas-soft active:scale-95"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline bg-canvas-soft/50 px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <img
              src="/android-chrome-192x192.png"
              alt="Edulink logo"
              className="h-7 w-7 rounded-lg object-cover"
            />
            <span className="font-amatry text-xl text-ink">Edulink</span>
          </div>
          <p className="text-xs text-ink-muted">
            © {new Date().getFullYear()} Edulink. Plateforme académique pour étudiants et enseignants.
          </p>
        </div>
      </footer>
    </div>
  )
}
