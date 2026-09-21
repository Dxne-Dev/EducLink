'use client'

import dynamic from 'next/dynamic'
import { Icon } from '@iconify/react'
import { HiOutlineDotsVertical } from 'react-icons/hi'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface AreaData {
  evolution: number[]
}

interface StatsAreaWidgetProps {
  title: string
  value: string | number
  growth: string
  icon: string
  href?: string
  chartData?: AreaData
}

const defaultAreaData: AreaData = {
  evolution: [0, 0, 0, 0, 0, 0, 0],
}

export function StatsAreaWidget({
  title,
  value,
  growth,
  icon,
  href = '#',
  chartData,
}: StatsAreaWidgetProps) {
  const data = chartData ?? defaultAreaData

  const chartOptions: any = {
    chart: {
      id: 'stats-area',
      type: 'area',
      height: 75,
      sparkline: {
        enabled: true,
      },
      fontFamily: 'inherit',
    },
    colors: ['#16CDC7'],
    stroke: {
      curve: 'smooth',
      width: 2.5,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [20, 100],
      },
    },
    tooltip: {
      theme: 'dark',
      fixed: {
        enabled: true,
        position: 'right',
      },
      x: {
        show: false,
      },
    },
  }

  return (
    <div className="relative w-full rounded-3xl bg-teal-50/70 p-6 shadow-xs transition-all hover:shadow-md dark:bg-teal-950/20 border border-teal-100/50 dark:border-teal-900/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-xs">
            <Icon icon={icon} height={22} />
          </span>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
            {title}
          </h4>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <HiOutlineDotsVertical size={18} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={href}>Consulter les détails</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">
            {value}
          </h2>
          <span className="mt-2 inline-block rounded-full bg-white/80 dark:bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-bold text-teal-600 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/50">
            {growth}
          </span>
        </div>
        <div className="w-28">
          <Chart
            options={chartOptions}
            series={[{ name: 'Évolution', data: data.evolution }]}
            type="area"
            height={75}
            width="100%"
          />
        </div>
      </div>
    </div>
  )
}