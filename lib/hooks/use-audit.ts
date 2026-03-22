import { useQuery } from '@tanstack/react-query'
import type { AuditLog } from '@/lib/types/audit'

export const AUDIT_QUERY_KEY = 'audit-logs'

export interface AuditFilters {
  user_id?: string
  action?: string
  table_name?: string
  limit?: number
  offset?: number
}

export function useAudits(filters?: AuditFilters) {
  return useQuery<AuditLog[]>({
    queryKey: [AUDIT_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters?.user_id) params.append('user_id', filters.user_id)
      if (filters?.action) params.append('action', filters.action)
      if (filters?.table_name) params.append('table_name', filters.table_name)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/admin/audit?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.statusText}`)
      }

      return response.json()
    },
    enabled: true, // Only admins can access this endpoint
  })
}
