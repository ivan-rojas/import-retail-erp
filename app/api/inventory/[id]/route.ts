import { NextRequest, NextResponse } from 'next/server'
import {
  getInventoryItemById,
  updateAccessoryItem,
  updateProductItem,
  updateUsedProductItem,
  getUsedProductItemByItemId,
} from '@/lib/database/inventory'
import {
  getCurrentUserServer,
  getUserProfileServer,
  canSellServer,
} from '@/lib/auth/auth-server'
import {
  auditUpdate,
  createAuditLog,
  getAuditContext,
} from '@/lib/database/audit'

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
    const { data, error } = await getInventoryItemById(id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/inventory/:id:', error)
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
    if (!profile || !canSellServer(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const auditContext = await getAuditContext()
    if (!auditContext) {
      return NextResponse.json(
        { error: 'Failed to get audit context' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { id } = await params
    // Body must include { table: 'product_items'|'accessory_items'|'used_product_items', updates: {...} }
    const { table, updates } = body as {
      table: 'product_items' | 'accessory_items' | 'used_product_items'
      updates: Record<string, unknown>
    }

    if (!table || !updates) {
      return NextResponse.json(
        { error: 'Invalid payload: table and updates are required' },
        { status: 400 }
      )
    }

    // For used products, the id parameter is the product_items.id (item_id)
    // We need to find the used_product_items record by item_id
    let usedProductItemId: string | null = null
    if (table === 'used_product_items') {
      const { data: usedItem, error: fetchError } =
        await getUsedProductItemByItemId(id)

      if (fetchError || !usedItem) {
        console.error('Error fetching used product item:', fetchError)
        return NextResponse.json(
          { error: fetchError?.message || 'Used product item not found' },
          { status: 404 }
        )
      }
      usedProductItemId = usedItem.id
    }

    // Get current item for audit (id is always product_items.id or accessory_items.id)
    const { data: currentItem } = await getInventoryItemById(id)

    let data: unknown
    let error: { message?: string } | null = null
    if (table === 'product_items') {
      const res = await updateProductItem(id, updates)
      data = res.data
      error = res.error
    } else if (table === 'accessory_items') {
      const res = await updateAccessoryItem(id, updates)
      data = res.data
      error = res.error
    } else if (table === 'used_product_items') {
      if (!updates.product_items || !updates.used_product_items) {
        return NextResponse.json(
          {
            error:
              'Invalid payload: product_items and used_product_items are required',
          },
          { status: 400 }
        )
      }

      const productItemRes = await updateProductItem(
        id,
        updates.product_items as Record<string, unknown>
      )
      const usedProductItemRes = await updateUsedProductItem(
        usedProductItemId ?? '',
        updates.used_product_items as Record<string, unknown>
      )

      data = {
        product_items: productItemRes.data,
        used_product_items: usedProductItemRes.data,
      }
      error =
        productItemRes.error || usedProductItemRes.error
          ? {
              message:
                productItemRes.error?.message ||
                usedProductItemRes.error?.message,
            }
          : null
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const updatedItem = data as Record<string, unknown>

    // Audit the update
    await auditUpdate(table, id, currentItem || {}, updatedItem, auditContext, {
      item_name: updatedItem.name,
      imei: updatedItem.imei,
      status_change: currentItem?.status !== updatedItem.status,
    })

    // If status changed to sold/reserved, audit inventory adjustment
    if (
      currentItem?.status !== updatedItem.status &&
      ['sold', 'reserved'].includes(updatedItem.status as string)
    ) {
      await createAuditLog(
        {
          action: 'INVENTORY_ADJUST',
          table_name: table,
          record_id: id,
          business_context: {
            item_name: updatedItem.name,
            old_status: currentItem?.status,
            new_status: updatedItem.status,
            automatic: false,
          },
          notes: `Manual status change: ${currentItem?.status} → ${updatedItem.status}`,
        },
        auditContext
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/inventory/:id:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
