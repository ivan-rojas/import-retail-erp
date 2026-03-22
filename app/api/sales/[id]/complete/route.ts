import { NextRequest, NextResponse } from 'next/server'
import { completeSale } from '@/lib/database/sales'
import {
  canSellServer,
  getCurrentUserServer,
  getUserProfileServer,
} from '@/lib/auth/auth-server'
import { auditUpdate, getAuditContext } from '@/lib/database/audit'

export async function POST(
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

    // Validate body
    if (body.savePayments === undefined) {
      return NextResponse.json(
        { error: 'Invalid body: savePayments is required' },
        { status: 400 }
      )
    }

    // If savePayments is true, data is required. If false, we can send empty array or omit it
    if (body.savePayments && !body.data) {
      return NextResponse.json(
        { error: 'Invalid body: data is required when savePayments is true' },
        { status: 400 }
      )
    }

    const { data, error } = await completeSale(
      id,
      body.data || [],
      user.id,
      body.savePayments
    )

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const auditContext = await getAuditContext()
    if (!auditContext) {
      return NextResponse.json(
        { error: 'Failed to get audit context' },
        { status: 500 }
      )
    }

    await auditUpdate('sales', id, {}, data, auditContext)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/sales/:id/complete:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
