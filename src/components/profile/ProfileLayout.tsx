import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react'

import { cn } from '@/lib/utils'
import { PageHeader, type PageHeaderCrumb } from '@/components/layout/PageHeader'

export interface ProfileField {
  label: string
  value: ReactNode
  hint?: string
  full?: boolean
}

export interface ProfileSection {
  title: string
  fields: ProfileField[]
  /** Occupe toute la largeur de la grille des sections (listes longues de chips). */
  wide?: boolean
}

interface ProfileLayoutProps {
  breadcrumb: PageHeaderCrumb[]
  heading: string
  subtitle?: string
  name: string
  email: string
  initial: string
  metaLine?: string
  badges?: ReactNode
  /** Affiche le cadenas de vérification à côté du nom. */
  verified?: boolean
  sections: ProfileSection[]
  sectionsTitle?: string
  sectionsDescription?: string
  /** Affiche la pastille de verrouillage sur l'en-tête des sections. */
  readOnly?: boolean
  /** Libellé de la pastille de verrouillage. */
  readOnlyLabel?: string
  /** Slot pour du contenu additionnel (ex : formulaire mot de passe). */
  extraContent?: ReactNode
  backHref: string
  backLabel: string
}

export function ProfileLayout({
  breadcrumb,
  heading,
  subtitle,
  name,
  email,
  initial,
  metaLine,
  badges,
  verified = true,
  sections,
  sectionsTitle,
  sectionsDescription,
  readOnly = false,
  readOnlyLabel = 'Lecture seule',
  extraContent,
  backHref,
  backLabel,
}: ProfileLayoutProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader breadcrumb={breadcrumb} title={heading} subtitle={subtitle} />

      {/* Carte identité */}
      <div className="rounded-3xl border border-hairline bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 font-amatry text-3xl font-bold text-primary shadow-sm">
            {initial}
          </div>
          <div className="flex w-full flex-wrap items-center justify-center gap-4 sm:justify-between">
            <div className="flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <h2 className="text-heading-2 text-ink dark:text-slate-100">{name}</h2>
                {verified && (
                  <span title="Profil vérifié">
                    <ShieldCheck className="h-5 w-5 text-accent-teal" />
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1 text-body-sm text-ink-muted dark:text-slate-400 sm:justify-start md:gap-3">
                <span>{email}</span>
                {metaLine && <div className="hidden h-4 w-px bg-hairline xl:block" />}
                {metaLine && <span>{metaLine}</span>}
              </div>
              {badges && <div className="flex flex-wrap justify-center gap-2 sm:justify-start">{badges}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* En-tête des sections verrouillées */}
      {(sectionsTitle || sectionsDescription) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {sectionsTitle && (
              <h2 className="flex items-center gap-2 text-title font-bold text-ink dark:text-slate-100">
                <Lock className="h-4 w-4 text-accent-purple-deep" />
                {sectionsTitle}
              </h2>
            )}
            {sectionsDescription && (
              <p className="mt-1 text-body-sm text-ink-muted dark:text-slate-400">{sectionsDescription}</p>
            )}
          </div>
          {readOnly && (
            <span className="flex items-center gap-1 rounded-full bg-canvas-soft px-3 py-1 text-[11px] font-medium text-ink-muted dark:bg-slate-800 dark:text-slate-300">
              <Lock className="h-3 w-3" /> {readOnlyLabel}
            </span>
          )}
        </div>
      )}

      {/* Sections informations */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {sections.map((section) => (
          <div
            key={section.title}
            className={cn(
              'space-y-5 rounded-3xl border border-hairline bg-white p-6 dark:border-slate-800 dark:bg-slate-900',
              section.wide && 'xl:col-span-2'
            )}
          >
            <h3 className="font-bold text-ink dark:text-slate-100">{section.title}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-7">
              {section.fields.map((field) => (
                <div key={field.label} className={cn(field.full && 'sm:col-span-2')}>
                  <p className="text-caption text-ink-muted dark:text-slate-400">{field.label}</p>
                  <div className="mt-0.5 text-body-sm font-medium text-ink dark:text-slate-100">{field.value}</div>
                  {field.hint && <p className="mt-1 text-[11px] text-ink-faint">{field.hint}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {extraContent}

      {/* Retour dashboard */}
      <div className="pt-2">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-body-sm font-medium text-ink-muted transition-colors hover:text-ink dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </div>
    </div>
  )
}