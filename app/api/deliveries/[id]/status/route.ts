import {
  canSellServer,
  getCurrentUserServer,
  getUserProfileServer,
} from '@/lib/auth/auth-server'
import { auditUpdate, getAuditContext } from '@/lib/database/audit'
import { updateDeliveryStatus } from '@/lib/database/deliveries'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfileServer(user.id)
    if (!profile || !canSellServer(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { data, error } = await updateDeliveryStatus(id, body.status, user.id)

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

    await auditUpdate('deliveries', id, {}, data, auditContext, {
      status: data.status,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/deliveries/:id/status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
