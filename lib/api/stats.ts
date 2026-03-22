import type {
  DashboardStats,
  InventoryStats,
  SalesStats,
  ProfitsStats,
} from '@/lib/types/stats'

export class StatsApi {
  constructor(
    private request: <T>(endpoint: string, options?: RequestInit) => Promise<T>
  ) {}

  async getStats(): Promise<DashboardStats> {
    return this.request('/stats')
  }

  async getInventoryStats(): Promise<InventoryStats> {
    return this.request('/stats/inventory')
  }

  async getSalesStats(): Promise<SalesStats> {
    return this.request('/stats/sales')
  }

  async getProfitsStats(fromDate?: Date, toDate?: Date): Promise<ProfitsStats> {
    const params = new URLSearchParams()
    if (fromDate) {
      params.append('from', fromDate.toISOString())
    }
    if (toDate) {
      params.append('to', toDate.toISOString())
    }
    const queryString = params.toString()
    return this.request(`/stats/profits${queryString ? `?${queryString}` : ''}`)
  }
}
