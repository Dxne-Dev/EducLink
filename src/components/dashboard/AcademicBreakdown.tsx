'use client'

import { Icon } from '@iconify/react'
import { HiOutlineDotsVertical } from 'react-icons/hi'
import { ArrowRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface BreakdownItem {
  icon: string
  title: string
  subtitle: string
  color: string
  textColor: string
  tag: string
  tagColor: string
  href?: string
}

interface AcademicBreakdownProps {
  title?: string
  items?: BreakdownItem[]
  totalResources?: number
  typeCounts?: Record<string, number>
  libraryHref?: string
  libraryLabel?: string
  templatesHref?: string
  templatesLabel?: string
}

function buildItemsFromData(
  total: number,
  typeCounts: Record<string, number>
): BreakdownItem[] {
  if (total === 0) {
    return [
      { icon: 'solar:file-text-bold-duotone', title: 'Supports PDF', subtitle: 'Polycopiés et diaporamas', color: 'bg-sky-500/15', textColor: 'text-primary', tag: '0%', tagColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
      { icon: 'solar:clipboard-list-bold-duotone', title: 'Fiches TD', subtitle: 'Exercices et énoncés', color: 'bg-teal-500/15', textColor: 'text-teal-600 dark:text-teal-400', tag: '0%', tagColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
      { icon: 'solar:diploma-verified-bold-duotone', title: 'Examens', subtitle: 'Annales et sujets types', color: 'bg-amber-500/15', textColor: 'text-amber-600 dark:text-amber-400', tag: '0%', tagColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
      { icon: 'solar:folder-with-files-bold-duotone', title: 'Stages', subtitle: 'Rapports et gabarits', color: 'bg-purple-500/15', textColor: 'text-purple-600 dark:text-purple-400', tag: '0%', tagColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' },
    ]
  }

  const map: Record<string, { title: string; subtitle: string; icon: string; color: string; textColor: string; tagColor: string }> = {
    cours: { title: 'Supports PDF', subtitle: 'Polycopiés et diaporamas', icon: 'solar:file-text-bold-duotone', color: 'bg-sky-500/15', textColor: 'text-primary', tagColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
    td: { title: 'Fiches TD', subtitle: 'Exercices et énoncés', icon: 'solar:clipboard-list-bold-duotone', color: 'bg-teal-500/15', textColor: 'text-teal-600 dark:text-teal-400', tagColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
    examen: { title: 'Examens', subtitle: 'Annales et sujets types', icon: 'solar:diploma-verified-bold-duotone', color: 'bg-amber-500/15', textColor: 'text-amber-600 dark:text-amber-400', tagColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
    tp: { title: 'TP', subtitle: 'Travaux pratiques', icon: 'solar:flask-bold-duotone', color: 'bg-rose-500/15', textColor: 'text-rose-600 dark:text-rose-400', tagColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
    fiche: { title: 'Fiches', subtitle: 'Fiches de révision', icon: 'solar:note-bold-duotone', color: 'bg-indigo-500/15', textColor: 'text-indigo-600 dark:text-indigo-400', tagColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' },
    autre: { title: 'Autres', subtitle: 'Documents divers', icon: 'solar:folder-with-files-bold-duotone', color: 'bg-purple-500/15', textColor: 'text-purple-600 dark:text-purple-400', tagColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' },
  }

  const entries = Object.entries(typeCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)

  if (entries.length === 0) {
    return [
      { icon: 'solar:file-text-bold-duotone', title: 'Supports PDF', subtitle: 'Polycopiés et diaporamas', color: 'bg-sky-500/15', textColor: 'text-primary', tag: '0%', tagColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
      { icon: 'solar:clipboard-list-bold-duotone', title: 'Fiches TD', subtitle: 'Exercices et énoncés', color: 'bg-teal-500/15', textColor: 'text-teal-600 dark:text-teal-400', tag: '0%', tagColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
      { icon: 'solar:diploma-verified-bold-duotone', title: 'Examens', subtitle: 'Annales et sujets types', color: 'bg-amber-500/15', textColor: 'text-amber-600 dark:text-amber-400', tag: '0%', tagColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
      { icon: 'solar:folder-with-files-bold-duotone', title: 'Stages', subtitle: 'Rapports et gabarits', color: 'bg-purple-500/15', textColor: 'text-purple-600 dark:text-purple-400', tag: '0%', tagColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' },
    ]
  }

  return entries.map(([type, count]) => {
    const pct = Math.round((count / total) * 100)
    const cfg = map[type] ?? { title: type, subtitle: '', icon: 'solar:file-text-bold-duotone', color: 'bg-slate-500/15', textColor: 'text-slate-600', tagColor: 'bg-slate-50 text-slate-700' }
    return {
      icon: cfg.icon,
      title: cfg.title,
      subtitle: cfg.subtitle,
      color: cfg.color,
      textColor: cfg.textColor,
      tag: `${pct}%`,
      tagColor: cfg.tagColor,
    }
  })
}

export function AcademicBreakdown({
  title = 'Répartition & Formats',
  items,
  totalResources,
  typeCounts,
  libraryHref = '/etudiant/ressources',
  libraryLabel = 'Voir la bibliothèque',
  templatesHref = '/etudiant/stages',
  templatesLabel = 'gabarits de stages',
}: AcademicBreakdownProps) {
  const list = items ?? (totalResources != null && typeCounts
    ? buildItemsFromData(totalResources, typeCounts)
    : undefined)

  if (!list) return null

  return (
    <div className="relative w-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <HiOutlineDotsVertical size={18} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={libraryHref}>{libraryLabel}</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 space-y-4">
        {list.map((item, index) => (
          <div
            key={index}
            className={`flex items-center justify-between border-b border-slate-100 pb-3.5 last:border-0 last:pb-0 dark:border-slate-800/80 ${item.href ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 py-2 -mx-2 transition-colors' : ''}`}
          >
            {item.href ? (
              <Link href={item.href} className="flex items-center gap-3 flex-1 min-w-0">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.color} ${item.textColor}`}
                >
                  <Icon icon={item.icon} height={22} />
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug truncate">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {item.subtitle}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
              </Link>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.color} ${item.textColor}`}
                  >
                    <Icon icon={item.icon} height={22} />
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${item.tagColor}`}
                >
                  {item.tag}
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4 text-center dark:border-slate-800">
        <Link
          href={templatesHref}
          className="text-xs font-bold text-primary hover:underline dark:text-sky-400"
        >
          {templatesLabel}
        </Link>
      </div>
    </div>
  )
}