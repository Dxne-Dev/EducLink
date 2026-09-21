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

interface SparklineData {
  actifs: number[]
  total: number[]
}

interface StatsBarWidgetProps {
  title: string
  value: string | number
  growth: string
  icon: string
  href?: string
  chartData?: SparklineData
}

const defaultSparkData: SparklineData = {
  actifs: [0, 0, 0, 0, 0, 0],
  total: [1, 1, 1, 1, 1, 1],
}

export function StatsBarWidget({
  title,
  value,
  growth,
  icon,
  href = '#',
  chartData,
}: StatsBarWidgetProps) {
  const data = chartData ?? defaultSparkData

  const chartOptions: any = {
    chart: {
      fontFamily: 'inherit',
      type: 'bar',
      height: 90,
      stacked: true,
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: true,
      },
    },
    grid: {
      show: false,
    },
    colors: ['#ef4444', '#f1f5f9'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '35%',
        borderRadius: [4],
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'all',
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      theme: 'dark',
    },
  }

  return (
    <div className="relative w-full rounded-3xl bg-rose-50/70 p-6 shadow-xs transition-all hover:shadow-md dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-xs">
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
          <span className="mt-2 inline-block rounded-full bg-white/80 dark:bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50">
            {growth}
          </span>
        </div>
        <div className="w-28">
          <Chart
            options={chartOptions}
            series={[
              { name: 'Actifs', data: data.actifs },
              { name: 'Total', data: data.total },
            ]}
            type="bar"
            height={90}
            width="100%"
          />
        </div>
      </div>
    </div>
  )
}