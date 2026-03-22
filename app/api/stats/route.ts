import { NextResponse } from 'next/server'
import {
  getInventoryStats,
  getSalesStats,
  getProfitsStats,
} from '@/lib/database/stats'
import {
  getCurrentUserServer,
  getUserProfileServer,
  isAdminServer,
  canSellServer,
  canManageInventoryServer,
} from '@/lib/auth/auth-server'
import type { InventoryStats, SalesStats } from '@/lib/types/stats'

function getMonthRange(monthOffset: number) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0)
  return { start, end }
}

export async function GET() {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfileServer(user.id)
    if (!profile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Role-based access control
    const isAdmin = isAdminServer(profile)
    const canSell = canSellServer(profile)
    const canManageInventory = canManageInventoryServer(profile)

    // Determine which stats to fetch based on role
    const shouldFetchInventory = isAdmin || canManageInventory
    const shouldFetchSales = isAdmin || canSell

    const userId = isAdmin ? undefined : user.id

    if (!shouldFetchInventory && !shouldFetchSales) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch stats based on permissions
    const promises = []
    if (shouldFetchInventory) {
      promises.push(getInventoryStats())
    }
    if (shouldFetchSales) {
      promises.push(getSalesStats(userId))
    }

    const results = await Promise.all(promises)

    // Process results
    let inventoryStatsResult = null
    let salesStatsResult = null
    let resultIndex = 0

    if (shouldFetchInventory) {
      inventoryStatsResult = results[resultIndex++]
    }
    if (shouldFetchSales) {
      salesStatsResult = results[resultIndex++]
    }

    // Check for errors
    if (inventoryStatsResult?.error) {
      return NextResponse.json(
        { error: inventoryStatsResult.error },
        { status: 500 }
      )
    }

    if (salesStatsResult?.error) {
      const err = salesStatsResult.error as Error | string | undefined
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as Error).message
          : typeof err === 'string'
            ? err
            : String(err ?? 'Unknown error')
      console.error('[GET /api/stats] getSalesStats failed:', message, err)
      return NextResponse.json(
        { error: message || 'Failed to load sales stats' },
        { status: 500 }
      )
    }

    // Return only the stats the user is allowed to see
    const response: { inventory?: InventoryStats; sales?: SalesStats } = {}
    if (shouldFetchInventory && inventoryStatsResult?.data) {
      response.inventory = inventoryStatsResult.data as InventoryStats
    }
    if (shouldFetchSales && salesStatsResult?.data) {
      const sales = salesStatsResult.data as SalesStats
      // Enrich with profit for current month and previous month (for "Ganancia del mes" card)
      try {
        const [currentMonthProfits, lastMonthProfits] = await Promise.all([
          getProfitsStats(getMonthRange(0).start, getMonthRange(0).end),
          getProfitsStats(getMonthRange(-1).start, getMonthRange(-1).end),
        ])
        if (currentMonthProfits.data) {
          sales.currentMonth.profit = currentMonthProfits.data.totalProfit
          sales.currentMonth.cost = currentMonthProfits.data.totalCost
        }
        if (lastMonthProfits.data && sales.lastYear[1]) {
          sales.lastYear[1].profit = lastMonthProfits.data.totalProfit
          sales.lastYear[1].cost = lastMonthProfits.data.totalCost
        }
      } catch (profitErr) {
        console.error('[GET /api/stats] getProfitsStats failed:', profitErr)
        // Leave profit/cost undefined; dashboard will not show gain card or show 0
      }
      response.sales = sales
    }

    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    console.error('[GET /api/stats] Unexpected error:', message, stack ?? error)
    return NextResponse.json(
      { error: message || 'Internal server error' },
      { status: 500 }
    )
  }
}
