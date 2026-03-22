'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/ui/chart'
import { calculatePercentageChange, formatPercentageChange } from '@/lib/utils'
import type { SalesStats } from '@/lib/types/stats'

export const description = 'Revenue chart showing last 12 months'

// Transform stats data for chart consumption
const transformStatsToChartData = (stats: SalesStats) => {
  const monthNames = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ]

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const getMonthWithYear = (monthOffset: number) => {
    const targetDate = new Date(currentYear, currentMonth - monthOffset, 1)
    const month = monthNames[targetDate.getMonth()]
    const year = targetDate.getFullYear()
    return `${month} ${year}`
  }

  return stats.lastYear
    .map((monthData, index) => ({
      month: getMonthWithYear(index),
      revenue: monthData.revenue,
    }))
    .reverse() // Reverse to show oldest to newest
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

export function SalesChart({
  stats,
  isLoading,
}: {
  stats: SalesStats | undefined
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ingresos de los Últimos 12 Meses</CardTitle>
          <CardDescription>Cargando datos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Cargando gráfico...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ingresos de los Últimos 12 Meses</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">
              No hay datos para mostrar
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = transformStatsToChartData(stats)
  const currentMonthRevenue = stats?.lastYear[0].revenue
  const lastMonthRevenue = stats?.lastYear[1].revenue || 0
  const percentageChange = calculatePercentageChange(
    currentMonthRevenue,
    lastMonthRevenue
  )
  const isPositive = percentageChange >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos de los Últimos 12 Meses</CardTitle>
        <CardDescription className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div
              className={`flex items-center gap-2 leading-none font-medium ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatPercentageChange(percentageChange)} este mes{' '}
              <TrendIcon className="h-4 w-4" />
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => [
                    `$${Number(value).toLocaleString()} `,
                    'Ingresos',
                  ]}
                />
              }
            />
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="revenue"
              type="natural"
              fill="url(#fillRevenue)"
              fillOpacity={0.4}
              stroke="var(--color-revenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}
