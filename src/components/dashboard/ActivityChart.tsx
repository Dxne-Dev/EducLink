'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface ActivityDataPoint {
  downloads: number
  consultations: number
}

interface ActivityChartProps {
  title?: string
  subtitle?: string
  data?: ActivityDataPoint[]
  categories?: string[]
  seriesNames?: { downloads: string; consultations: string }
}

export function ActivityChart({
  title = 'Activité Pédagogique',
  subtitle = 'Consultations et téléchargements de cours',
  data,
  categories,
  seriesNames = { downloads: 'Téléchargements', consultations: 'Consultations' },
}: ActivityChartProps) {
  const [period, setPeriod] = useState('semestre')

  const defaultData: ActivityDataPoint[] = Array.from({ length: 8 }, () => ({
    downloads: 0,
    consultations: 0,
  }))

  const defaultCategories = Array.from({ length: 8 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (7 - i))
    return d.toLocaleDateString('fr-FR', { month: 'short' })
  })

  const chartData = data ?? defaultData
  const chartCategories = categories ?? defaultCategories

  const options: any = {
    chart: {
      fontFamily: 'inherit',
      foreColor: '#94a3b8',
      fontSize: '12px',
      offsetX: 0,
      offsetY: 10,
      animations: {
        speed: 500,
      },
      toolbar: {
        show: false,
      },
      background: 'transparent',
    },
    colors: ['#0075de', '#16CDC7'],
    dataLabels: {
      enabled: false,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0,
        inverseColors: false,
        opacityFrom: 0.25,
        opacityTo: 0.05,
        stops: [20, 100],
      },
    },
    grid: {
      show: true,
      strokeDashArray: 3,
      borderColor: 'rgba(148, 163, 184, 0.2)',
    },
    stroke: {
      curve: 'smooth',
      width: 2.5,
    },
    xaxis: {
      categories: chartCategories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: '#94a3b8',
        },
      },
    },
    yaxis: {
      min: 0,
      tickAmount: 4,
      labels: {
        style: {
          colors: '#94a3b8',
        },
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: '#94a3b8',
      },
    },
    tooltip: {
      theme: 'dark',
    },
  }

  const series = [
    {
      name: seriesNames.downloads,
      data: chartData.map((d) => d.downloads),
    },
    {
      name: seriesNames.consultations,
      data: chartData.map((d) => d.consultations),
    },
  ]

  return (
    <div className="relative w-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Période :</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="semestre">Semestre en cours</option>
            <option value="annee">Année Universitaire</option>
            <option value="30jours">30 derniers jours</option>
          </select>
        </div>
      </div>

      <div className="-ms-3 -me-2 mt-4">
        <Chart
          options={options}
          series={series}
          type="area"
          height={300}
          width="100%"
        />
      </div>
    </div>
  )
}