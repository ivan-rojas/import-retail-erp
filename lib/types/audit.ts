import type { UserProfile } from '@/lib/auth/auth'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_RESET'
  | 'ROLE_CHANGE'
  | 'STATUS_CHANGE'
  | 'SALE_COMPLETE'
  | 'RESERVATION_CREATE'
  | 'RESERVATION_CANCEL'
  | 'PAYMENT_CREATE'
  | 'PAYMENT_UPDATE'
  | 'DELIVERY_UPDATE'
  | 'INVENTORY_ADJUST'
  | 'BATCH_CREATE'
  | 'TRADE_IN_PROCESS'

export interface AuditLog {
  id: string
  action: AuditAction
  table_name: string
  record_id?: string | null
  user_id?: string | null
  user_email?: string | null
  user_role?: UserProfile['role'] | null
  old_values?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
  changed_fields?: string[] | null
  ip_address?: string | null
  user_agent?: string | null
  session_id?: string | null
  business_context?: Record<string, unknown> | null
  notes?: string | null
  created_at: string
}

export interface CreateAuditLogInput {
  action: AuditAction
  table_name: string
  record_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  changed_fields?: string[]
  business_context?: Record<string, unknown>
  notes?: string
  ip_address?: string
  user_agent?: string
  session_id?: string
}

export interface AuditContext {
  user_id?: string
  user_email?: string
  user_role?: UserProfile['role']
  ip_address?: string
  user_agent?: string
  session_id?: string
}
