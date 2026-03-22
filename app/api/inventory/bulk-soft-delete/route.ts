import {
  canManageInventoryServer,
  getCurrentUserServer,
  getUserProfileServer,
} from '@/lib/auth/auth-server'
import { softDeleteProductItems } from '@/lib/database/inventory'
import { softDeleteAccessoryItems } from '@/lib/database/inventory'
import { NextResponse, NextRequest } from 'next/server'

type BulkSoftDeleteItems = {
  id: string
  table: 'product_items' | 'accessory_items' | 'used_product_items'
}

export async function POST(request: NextRequest) {
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
    const items = body as Array<BulkSoftDeleteItems>

    const productItems: Array<string> = []
    const accessoryItems: Array<string> = []

    // Validate items structure
    if (items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    for (const item of items) {
      if (!item.id || !item.table) {
        return NextResponse.json(
          {
            error: 'Invalid item structure.',
          },
          { status: 400 }
        )
      }
      if (
        item.table === 'product_items' ||
        item.table === 'used_product_items'
      ) {
        productItems.push(item.id)
      } else if (item.table === 'accessory_items') {
        accessoryItems.push(item.id)
      }
    }

    if (productItems.length === 0 && accessoryItems.length === 0) {
      return NextResponse.json({ error: 'No items to delete' }, { status: 400 })
    }

    if (productItems.length > 0) {
      const { error: productItemsError } = await softDeleteProductItems(
        productItems
      )
      if (productItemsError) {
        console.error('Error deleting product items:', productItemsError)
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }
    }

    if (accessoryItems.length > 0) {
      const { error: accessoryItemsError } = await softDeleteAccessoryItems(
        accessoryItems
      )
      if (accessoryItemsError) {
        console.error('Error deleting accessory items:', accessoryItemsError)
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/inventory/bulk-soft-delete:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
