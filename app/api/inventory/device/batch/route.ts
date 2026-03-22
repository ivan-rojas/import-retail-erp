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
      batch,
      product_id,
      name,
      color,
      storage,
      price,
      wholesale_price,
      cost,
      imeis = [],
      condition,
      usedDetails,
    } = body

    if (!batch) {
      return NextResponse.json({ error: 'Missing batch' }, { status: 400 })
    }

    // Reuse an existing batch with same name and date if present to avoid duplicates
    const { data: existingBatch } = await supabase
      .from('batchs')
      .select('id')
      .eq('name', batch.name)
      .eq('date', batch.date)
      .limit(1)
      .maybeSingle()

    let batchRow = existingBatch as { id: string } | null
    let batchError: { message: string } | null = null

    if (!batchRow) {
      const created = await supabase
        .from('batchs')
        .insert({
          name: batch.name,
          description: batch.description || null,
          date: batch.date,
          created_by: user.id,
          updated_by: user.id,
        })
        .select('id')
        .single()

      batchRow = created.data as { id: string } | null
      batchError = created.error as { message: string } | null
    }

    if (batchError) {
      return NextResponse.json({ error: batchError.message }, { status: 500 })
    }

    if (!batchRow?.id) {
      return NextResponse.json(
        { error: 'Failed to create/reuse batch' },
        { status: 500 }
      )
    }
    const batchId = batchRow.id

    const items = (imeis.length ? imeis : [null]).map(
      (imei: string | null) => ({
        product_id,
        batch_id: batchId,
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

    await auditCreate('batchs', batchId, batch, auditContext, {
      name: batch.name,
      description: batch.description,
      date: batch.date,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/inventory/device/batch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
