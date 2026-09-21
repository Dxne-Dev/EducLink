'use client'

import { Icon } from '@iconify/react'
import { HiOutlineDotsVertical } from 'react-icons/hi'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'

interface ResourceItem {
  id: string
  title: string
  matiere: string
  author: string
  type: string
  downloads: number
  progress: number
  status: string
  statusColor: 'success' | 'warning' | 'primary' | 'error'
}

interface PopularResourcesTableProps {
  resources?: ResourceItem[]
  title?: string
  subtitle?: string
  seeAllHref?: string
  resourceHref?: string
}

export function PopularResourcesTable({
  title = 'Supports & Matières Populaires',
  subtitle = 'Les ressources les plus consultées cette semaine',
  resources,
  seeAllHref = '/etudiant/ressources',
  resourceHref = '/etudiant/ressources',
}: PopularResourcesTableProps) {
  if (!resources || resources.length === 0) {
    return (
      <div className="relative w-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        <EmptyState
          icon={<Icon icon="solar:document-text-bold-duotone" height={26} className="text-ink-faint" />}
          title="Aucun document pour le moment"
          description="Les documents publiés apparaîtront automatiquement ici."
        />
      </div>
    )
  }
  const items = resources


  return (
    <div className="relative w-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>

        <Link
          href={seeAllHref}
          className="text-xs font-semibold text-primary hover:underline dark:text-sky-400"
        >
          Voir tout
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 dark:border-slate-800">
              <TableHead className="text-xs font-bold uppercase text-slate-400">Ressource</TableHead>
              <TableHead className="text-xs font-bold uppercase text-slate-400">Consultations</TableHead>
              <TableHead className="text-xs font-bold uppercase text-slate-400">Statut</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.id}
                className="border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-slate-800/60 dark:hover:bg-slate-800/30"
              >
                <TableCell className="py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-300 font-bold text-xs">
                      <Icon icon="solar:document-text-bold-duotone" height={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.matiere} • <span className="font-medium">{item.author}</span>
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-3.5">
                  <div className="w-36 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.downloads} vues
                      </span>
                      <span className="text-slate-400">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-1.5" />
                  </div>
                </TableCell>

                <TableCell className="py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.statusColor === 'success'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50'
                        : item.statusColor === 'warning'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50'
                        : item.statusColor === 'error'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/50'
                        : 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200/50'
                    }`}
                  >
                    {item.status}
                  </span>
                </TableCell>

                <TableCell className="py-3.5 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                        <HiOutlineDotsVertical size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={resourceHref}>Consulter la ressource</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}