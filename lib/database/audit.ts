import 'server-only'

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  getCurrentUserServer,
  getUserProfileServer,
} from '@/lib/auth/auth-server'
import type {
  CreateAuditLogInput,
  AuditContext,
  AuditLog,
  AuditAction,
} from '@/lib/types/audit'

// Create service role client for audit logs

const createAuditClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY!

  return createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Get current user context for audit
export const getAuditContext = async (
  request?: Request
): Promise<AuditContext> => {
  try {
    const user = await getCurrentUserServer()
    const profile = user ? await getUserProfileServer(user.id) : null

    const context: AuditContext = {
      user_id: user?.id,
      user_email: user?.email || profile?.email,
      user_role: profile?.role,
    }

    // Extract request context if available
    if (request) {
      const userAgent = request.headers.get('user-agent')
      const forwarded = request.headers.get('x-forwarded-for')
      const realIp = request.headers.get('x-real-ip')
      const ip = forwarded?.split(',')[0] || realIp || 'unknown'

      context.ip_address = ip
      context.user_agent = userAgent || undefined
    }

    return context
  } catch (error) {
    console.error('Error getting audit context:', error)
    return {}
  }
}

// Create audit log entry
export const createAuditLog = async (
  input: CreateAuditLogInput,
  context?: AuditContext
): Promise<{ data: AuditLog | null; error: Error | null }> => {
  try {
    const auditClient = createAuditClient()

    // Get context if not provided
    const auditContext = context || (await getAuditContext())

    const auditData = {
      action: input.action,
      table_name: input.table_name,
      record_id: input.record_id || null,
      user_id: auditContext.user_id || null,
      user_email: auditContext.user_email || null,
      user_role: auditContext.user_role || null,
      old_values: input.old_values || null,
      new_values: input.new_values || null,
      changed_fields: input.changed_fields || null,
      ip_address: input.ip_address || auditContext.ip_address || null,
      user_agent: input.user_agent || auditContext.user_agent || null,
      session_id: input.session_id || auditContext.session_id || null,
      business_context: input.business_context || null,
      notes: input.notes || null,
    }

    const { data, error } = await auditClient
      .from('audit_logs')
      .insert(auditData)
      .select()
      .single()

    if (error) {
      console.error('Error creating audit log:', error)
      return { data: null, error: new Error(error.message) }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error creating audit log:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    }
  }
}

// Get audit logs with filters
export const getAuditLogs = async (filters?: {
  user_id?: string
  action?: string
  table_name?: string
  record_id?: string
  limit?: number
  offset?: number
}): Promise<{ data: AuditLog[] | null; error: Error | null }> => {
  try {
    const supabase = await createServerClient()

    let query = supabase
      .from('audit_logs')
      .select('*')
      .neq('action', 'LOGIN')
      .neq('action', 'LOGOUT')
      .neq('user_role', 'super admin') // Filter out SUPER ADMIN logs
      .order('created_at', { ascending: false })

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters?.action) {
      query = query.eq('action', filters.action)
    }
    if (filters?.table_name) {
      query = query.eq('table_name', filters.table_name)
    }
    if (filters?.record_id) {
      query = query.eq('record_id', filters.record_id)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 50) - 1
      )
    }

    const { data, error } = await query

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    }
  }
}

// Helper functions for common audit patterns
export const auditCreate = async (
  tableName: string,
  recordId: string,
  newValues: Record<string, unknown>,
  context?: AuditContext,
  businessContext?: Record<string, unknown>
) => {
  return createAuditLog(
    {
      action: 'CREATE',
      table_name: tableName,
      record_id: recordId,
      new_values: newValues,
      business_context: businessContext,
      notes: 'Registro creado exitosamente',
    },
    context
  )
}

export const auditUpdate = async (
  tableName: string,
  recordId: string,
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>,
  context?: AuditContext,
  businessContext?: Record<string, unknown>
) => {
  const changedFields = Object.keys(newValues).filter(
    (key) => JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])
  )

  return createAuditLog(
    {
      action: 'UPDATE',
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues,
      new_values: newValues,
      changed_fields: changedFields,
      business_context: businessContext,
      notes: `Registro actualizado (${changedFields.length} campo${
        changedFields.length !== 1 ? 's' : ''
      } modificado${changedFields.length !== 1 ? 's' : ''})`,
    },
    context
  )
}

export const auditDelete = async (
  tableName: string,
  recordId: string,
  oldValues: Record<string, unknown>,
  context?: AuditContext,
  businessContext?: Record<string, unknown>
) => {
  return createAuditLog(
    {
      action: 'DELETE',
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues,
      business_context: businessContext,
      notes: 'Registro eliminado permanentemente',
    },
    context
  )
}

export const auditBusinessAction = async (
  action: Extract<
    AuditAction,
    'SALE_COMPLETE' | 'RESERVATION_CREATE' | 'PAYMENT_CREATE'
  >,
  recordId: string,
  businessContext: Record<string, unknown>,
  context?: AuditContext,
  notes?: string
) => {
  const actionNotes = {
    SALE_COMPLETE: 'Venta completada exitosamente',
    RESERVATION_CREATE: 'Reserva creada',
    PAYMENT_CREATE: 'Pago registrado',
  }

  return createAuditLog(
    {
      action,
      table_name: '',
      record_id: recordId,
      business_context: businessContext,
      notes: notes || actionNotes[action] || 'Acción de negocio completada',
    },
    context
  )
}
