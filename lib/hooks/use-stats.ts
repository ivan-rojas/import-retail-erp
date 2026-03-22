import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  DashboardStats,
  InventoryStats,
  SalesStats,
  ProfitsStats,
} from '@/lib/types/stats'

export const STATS_QUERY_KEY = 'stats'

export function useStats() {
  return useQuery<DashboardStats>({
    queryKey: [STATS_QUERY_KEY],
    queryFn: () => apiClient.getStats(),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}

export function useInventoryStats() {
  return useQuery<InventoryStats>({
    queryKey: [STATS_QUERY_KEY, 'inventory'],
    queryFn: () => apiClient.getInventoryStats(),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}

export function useSalesStats() {
  return useQuery<SalesStats>({
    queryKey: [STATS_QUERY_KEY, 'sales'],
    queryFn: () => apiClient.getSalesStats(),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}

export function useProfitsStats(fromDate?: Date, toDate?: Date) {
  return useQuery<ProfitsStats>({
    queryKey: [
      STATS_QUERY_KEY,
      'profits',
      fromDate?.toISOString(),
      toDate?.toISOString(),
    ],
    queryFn: () =>
      apiClient.getProfitsStats(fromDate ?? undefined, toDate ?? undefined),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}
