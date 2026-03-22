'use client'

import { useEffect, useState } from 'react'
import { SalesChart } from '@/components/features/stats/sales-chart'
import { useAuth } from '@/components/providers/auth/auth-provider'
import StatsCard from '@/components/shared/stats/stats-card'
import {
  canSell,
  canViewInventory,
  getUserProfile,
  UserProfile,
} from '@/lib/auth/auth'
import { useStats } from '@/lib/hooks/use-stats'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  const { data: stats, isLoading: statsLoading } = useStats()

  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      const userProfile = await getUserProfile()
      setProfile(userProfile)
    }

    checkAccess()
  }, [user, router])

  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin mx-auto mb-4 border-4 border-muted-foreground border-t-primary rounded-full"></div>
          <p className="text-muted-foreground text-lg">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const currentMonthRevenue = stats?.sales?.currentMonth?.revenue || 0
  const lastMonthRevenue = stats?.sales?.lastYear[1]?.revenue || 0
  const currentMonthSales = stats?.sales?.currentMonth?.sales || 0
  const lastMonthSales = stats?.sales?.lastYear[1]?.sales || 0
  const currentMonthProfit = stats?.sales?.currentMonth?.profit ?? 0
  const lastMonthProfit = stats?.sales?.lastYear[1]?.profit ?? 0

  return (
    <div className="calc-container">
      <div className="space-y-6 p-4 max-w-7xl mx-auto">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {canSell(profile) && (
            <>
              <StatsCard
                title="Ingresos del Mes"
                value={currentMonthRevenue}
                previousValue={lastMonthRevenue}
                description="Comparado con el mes anterior"
                descriptionTrendIcon={
                  currentMonthRevenue > lastMonthRevenue ? 'up' : 'down'
                }
              />

              <StatsCard
                title="Ventas del Mes"
                value={currentMonthSales}
                previousValue={lastMonthSales}
                description="Comparado con el mes anterior"
                isCurrency={false}
                descriptionTrendIcon={
                  (currentMonthSales ?? 0) > (lastMonthSales ?? 0)
                    ? 'up'
                    : 'down'
                }
              />

              <StatsCard
                title="Ganancia del Mes"
                value={currentMonthProfit}
                previousValue={lastMonthProfit}
                description="Comparado con el mes anterior"
                descriptionTrendIcon={
                  currentMonthProfit > lastMonthProfit ? 'up' : 'down'
                }
              />
            </>
          )}

          {canViewInventory(profile) && (
            <>
              <StatsCard
                title="Total de Productos"
                value={stats?.inventory?.totalItems || 0}
                isCurrency={false}
                showComparison={false}
              />

              <StatsCard
                title="Valor Total de Inventario"
                value={stats?.inventory?.totalValue || 0}
                showComparison={false}
                description="Costo total del inventario"
                footer={`$${stats?.inventory?.totalCost.toLocaleString()}`}
              />

              <StatsCard
                title="Total de Productos en Stock"
                value={stats?.inventory?.productsStock.length || 0}
                showComparison={false}
                isCurrency={false}
                description={
                  (stats?.inventory?.productsStock.length ?? 0) > 10
                    ? 'Buena cantidad de productos en stock'
                    : 'Baja cantidad de productos en stock'
                }
                descriptionTrendIcon={
                  (stats?.inventory?.productsStock.length ?? 0) > 10
                    ? 'up'
                    : 'down'
                }
              />

              <StatsCard
                title="Productos con Stock Bajo"
                value={stats?.inventory?.lowStockItems || 0}
                showComparison={false}
                isCurrency={false}
                description={
                  (stats?.inventory?.lowStockItems ?? 0) > 10
                    ? 'Buena cantidad de productos con stock bajo'
                    : 'Baja cantidad de productos con stock bajo'
                }
                descriptionTrendIcon={
                  (stats?.inventory?.lowStockItems ?? 0) <= 10 ? 'up' : 'down'
                }
              />

              <StatsCard
                title="Productos sin Stock"
                value={stats?.inventory?.outOfStockItems || 0}
                showComparison={false}
                isCurrency={false}
                description={
                  (stats?.inventory?.outOfStockItems ?? 0) > 10
                    ? 'Gran cantidad de productos sin stock'
                    : 'Baja cantidad de productos sin stock'
                }
                descriptionTrendIcon={
                  (stats?.inventory?.outOfStockItems ?? 0) <= 10 ? 'up' : 'down'
                }
              />
            </>
          )}
        </div>
        {canSell(profile) && (
          <SalesChart stats={stats?.sales} isLoading={statsLoading} />
        )}
      </div>
    </div>
  )
}
