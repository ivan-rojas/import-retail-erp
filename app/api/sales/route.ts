import { NextRequest, NextResponse } from 'next/server'
import { getSales, processSale } from '@/lib/database/sales'
import {
  getCurrentUserServer,
  getUserProfileServer,
  canSellServer,
  isAdminServer,
} from '@/lib/auth/auth-server'
import { createAuditLog, getAuditContext } from '@/lib/database/audit'
import { validateSaleItems } from '@/lib/utils/sale-items-validation'

export async function GET() {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string | undefined

    const profile = await getUserProfileServer(user.id)
    if (!profile || !isAdminServer(profile)) {
      userId = user.id
    }

    const { data, error } = await getSales(userId)

    if (error) {
      const message = error?.message ?? String(error)
      console.error('[GET /api/sales] getSales failed:', message, error)
      return NextResponse.json(
        { error: message || 'Failed to load sales' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    console.error('[GET /api/sales] Unexpected error:', message, stack ?? error)
    return NextResponse.json(
      { error: message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfileServer(user.id)
    if (!profile || !canSellServer(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const validation = validateSaleItems(body.sale_items)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const saleData = {
      ...body,
      seller_id: user.id,
      seller_name: profile.full_name || user.email || 'Unknown',
      sale_price: parseFloat(body.sale_price),
    }

    const { data: sale, error } = await processSale(saleData)

    if (error) {
      return NextResponse.json(
        { error: (error as Error)?.message || 'An unknown error occurred.' },
        { status: 500 }
      )
    }

    const auditContext = await getAuditContext()
    if (!auditContext) {
      return NextResponse.json(
        { error: 'Failed to get audit context' },
        { status: 500 }
      )
    }

    // Audit business action
    await createAuditLog(
      {
        action:
          sale.status === 'reserved' ? 'RESERVATION_CREATE' : 'SALE_COMPLETE',
        table_name: 'sales',
        record_id: sale.id,
        business_context: {
          sale_id: sale.id,
          customer_name: sale.customer_name,
          total_amount: sale.sale_price,
          items_count: body.sale_items?.length || 0,
        },
        notes: `${
          sale.status === 'reserved' ? 'Reserva' : 'Venta'
        } creada para ${sale.customer_name}`,
      },
      auditContext
    )

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/sales:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
