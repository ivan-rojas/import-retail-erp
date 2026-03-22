import { isAdmin } from '@/lib/auth/auth'
import {
  getCurrentUserServer,
  getUserProfileServer,
} from '@/lib/auth/auth-server'
import { getAuditLogs } from '@/lib/database/audit'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfileServer(user.id)

    // Only admins can view audit logs
    if (!profile || !isAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const filters = {
      user_id: url.searchParams.get('user_id') || undefined,
      action: url.searchParams.get('action') || undefined,
      table_name: url.searchParams.get('table_name') || undefined,
      limit: Number(url.searchParams.get('limit')) || 50,
      offset: Number(url.searchParams.get('offset')) || 0,
    }

    const { data, error } = await getAuditLogs(filters)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/admin/audit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
