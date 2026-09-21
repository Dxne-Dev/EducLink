'use client'

import { Icon } from '@iconify/react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'

interface ResourceCardItem {
  id: string
  title: string
  category: string
  author: string
  views: string | number
  downloads: string | number
  date: string
  href: string
  gradient: string
}

interface ResourceCardGridProps {
  cards?: ResourceCardItem[]
}

export function ResourceCardGrid({ cards }: ResourceCardGridProps) {
  if (!cards || cards.length === 0) {
    return (
      <EmptyState
        icon={<Icon icon="solar:folder-with-files-bold-duotone" height={26} className="text-ink-faint" />}
        title="Aucune ressource à afficher"
        description="Les nouvelles publications apparaîtront ici dès que de nouveaux documents seront publiés."
      />
    )
  }
  const items = cards

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="group block overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs transition-all hover:-translate-y-1.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Top Banner Card */}
          <div
            className={`relative flex h-36 w-full items-end p-5 bg-gradient-to-br ${item.gradient} text-white`}
          >
            <div className="absolute top-4 right-4 rounded-full bg-black/30 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white">
              {item.category}
            </div>
            <div className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-white/10 blur-xl" />
            <Icon icon="solar:folder-with-files-bold-duotone" height={36} className="text-white/80" />
          </div>

          {/* Card Body */}
          <div className="p-6">
            <h4 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-primary transition-colors dark:text-white leading-snug min-h-12">
              {item.title}
            </h4>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Icon icon="solar:user-circle-bold-duotone" height={16} className="text-primary" />
                <span>{item.author}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Icon icon="solar:eye-outline" height={14} />
                  {item.views}
                </span>
                <span className="flex items-center gap-1">
                  <Icon icon="solar:download-minimalistic-outline" height={14} />
                  {item.downloads}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
