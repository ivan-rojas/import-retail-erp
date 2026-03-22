import {
  canSellServer,
  getCurrentUserServer,
  getUserProfileServer,
} from '@/lib/auth/auth-server'
import { getInventoryItemsForSale } from '@/lib/database/sales'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfileServer(user.id)
    if (!profile || !canSellServer(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await getInventoryItemsForSale()

    if (error) {
      return NextResponse.json({ error: error }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/sales/inventory-item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
