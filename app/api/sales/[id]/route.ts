import { NextRequest, NextResponse } from 'next/server'
import { getSaleById, updateSale, deleteSale } from '@/lib/database/sales'
import {
  getCurrentUserServer,
  getUserProfileServer,
} from '@/lib/auth/auth-server'
import { canSell } from '@/lib/auth/auth'
import { auditDelete, auditUpdate, getAuditContext } from '@/lib/database/audit'
import { validateSaleItems } from '@/lib/utils/sale-items-validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { data, error } = await getSaleById(id)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Database error' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/sales/:id:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    if (!profile || !canSell(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id } = await params

    const validation = validateSaleItems(body.sale_items)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { data, error } = await updateSale(id, body)

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
    console.error('Error in PUT /api/sales/:id:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfileServer(user.id)
    if (!profile || !canSell(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { error } = await deleteSale(id)

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

    await auditDelete('sales', id, {}, auditContext)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/sales/:id:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
