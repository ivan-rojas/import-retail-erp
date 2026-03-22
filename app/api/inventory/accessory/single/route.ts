import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  getCurrentUserServer,
  getUserProfileServer,
  canManageInventoryServer,
} from '@/lib/auth/auth-server'
import { auditCreate, getAuditContext } from '@/lib/database/audit'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfileServer(user.id)
    if (!profile || !canManageInventoryServer(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const supabase = await createClient()

    const {
      product_id,
      batch_id,
      name,
      color,
      quantity,
      price,
      cost,
      wholesale_price,
      notes,
    } = body

    const { data, error } = await supabase
      .from('accessory_items')
      .insert({
        product_id,
        batch_id: batch_id ?? null,
        name,
        color,
        quantity: quantity ?? 1,
        price,
        wholesale_price,
        cost: cost ?? price,
        status: 'available',
        notes,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 })

    const auditContext = await getAuditContext()
    if (!auditContext) {
      return NextResponse.json(
        { error: 'Failed to get audit context' },
        { status: 500 }
      )
    }

    await auditCreate('accessory_items', data.id, data, auditContext, {
      name: data.name,
      color: data.color,
      quantity: data.quantity,
      price: data.price,
      wholesale_price: data.wholesale_price,
      cost: data.cost,
      notes: data.notes,
    })

    return NextResponse.json({ success: true, item: data })
  } catch (error) {
    console.error('Error in POST /api/inventory/accessory/single:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
