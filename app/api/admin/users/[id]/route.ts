import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/auth-server'
import { auditDelete, getAuditContext } from '@/lib/database/audit'

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await context.params
  try {
    await requireAdmin()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase server credentials are not configured' },
        { status: 500 }
      )
    }

    const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey)

    // Delete the auth user (profiles row has FK to auth.users with ON DELETE CASCADE)
    const { error } = await admin.auth.admin.deleteUser(resolvedParams.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const auditContext = await getAuditContext()
    if (!auditContext) {
      return NextResponse.json(
        { error: 'Failed to get audit context' },
        { status: 500 }
      )
    }

    await auditDelete('profiles', resolvedParams.id, {}, auditContext)

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const message =
      e instanceof Error && typeof e.message === 'string'
        ? e.message
        : 'Unauthorized'
    const status =
      message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await context.params
  try {
    await requireAdmin()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase server credentials are not configured' },
        { status: 500 }
      )
    }

    const body = (await req.json().catch(() => ({}))) as {
      full_name?: string
      role?: 'admin' | 'seller' | 'inventory' | 'viewer'
    }

    const updates: Record<string, unknown> = {}
    if (typeof body.full_name === 'string') updates.full_name = body.full_name
    if (body.role) updates.role = body.role

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No changes provided' },
        { status: 400 }
      )
    }

    const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey)

    // Update profile row
    const { data, error } = await admin
      .from('profiles')
      .update(updates)
      .eq('id', resolvedParams.id)
      .select('id, email, full_name, role, created_at, updated_at')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (e: unknown) {
    const message =
      e instanceof Error && typeof e.message === 'string'
        ? e.message
        : 'Unauthorized'
    const status =
      message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
