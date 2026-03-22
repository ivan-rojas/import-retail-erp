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
      storage,
      price,
      wholesale_price,
      cost,
      imeis = [],
      condition,
      usedDetails,
      notes,
      is_on_sale,
    } = body

    const items = (imeis.length ? imeis : [null]).map(
      (imei: string | null) => ({
        product_id,
        batch_id: batch_id ?? null,
        name,
        color,
        storage: storage || null,
        imei: imei || crypto.randomUUID(),
        price,
        wholesale_price,
        cost: cost ?? price,
        status: 'available',
        condition: condition === 'used' ? 'used' : 'new',
        created_by: user.id,
        updated_by: user.id,
        notes: notes ?? null,
        is_on_sale,
      })
    )

    const { data: createdItems, error } = await supabase
      .from('product_items')
      .insert(items)
      .select('id')

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 })

    if (condition === 'used' && createdItems && createdItems.length > 0) {
      // Transform fixes: serialize objects to JSON strings for database storage
      const fixesArray = usedDetails?.fixes ?? []
      const serializedFixes = fixesArray.map(
        (fix: { fix: string; cost: string }) => JSON.stringify(fix)
      )

      const usedRows = createdItems.map((it: { id: string }) => ({
        item_id: it.id,
        battery_health: usedDetails?.battery_health ?? 100,
        issues: usedDetails?.issues ?? [],
        fixes: serializedFixes,
        created_by: user.id,
        updated_by: user.id,
      }))
      const { error: usedError } = await supabase
        .from('used_product_items')
        .insert(usedRows)
      if (usedError)
        return NextResponse.json({ error: usedError.message }, { status: 500 })
    }

    const auditContext = await getAuditContext()
    if (!auditContext) {
      return NextResponse.json(
        { error: 'Failed to get audit context' },
        { status: 500 }
      )
    }

    await auditCreate(
      'product_items',
      createdItems[0].id,
      items[0],
      auditContext,
      {
        name: items[0].name,
        color: items[0].color,
        storage: items[0].storage,
        price: items[0].price,
        wholesale_price: items[0].wholesale_price,
        cost: items[0].cost,
        notes: items[0].notes,
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/inventory/device/single:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
