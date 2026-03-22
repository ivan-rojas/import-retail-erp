import { NextResponse } from 'next/server'
import {
  getInventoryItems,
  findProductItemByIMEI,
} from '@/lib/database/inventory'
import { getCurrentUserServer } from '@/lib/auth/auth-server'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imei = searchParams.get('imei')
    const excludeUnavailable = searchParams.get('excludeUnavailable')
    const excludeDeleted = searchParams.get('excludeDeleted')
    const includeInRepair = searchParams.get('includeInRepair')
    const saleId = searchParams.get('saleId') || undefined

    if (imei) {
      const { data, error } = await findProductItemByIMEI(
        imei,
        excludeUnavailable === 'true',
        excludeDeleted === 'true',
        includeInRepair === 'true',
        saleId
      )
      if (error) {
        const message =
          (error as { message?: string })?.message || 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
      }
      // Return 404 if IMEI not found, otherwise return the device data
      if (!data) {
        return NextResponse.json(null, { status: 404 })
      }
      return NextResponse.json(data)
    }

    const { data, error } = await getInventoryItems(
      excludeUnavailable === 'true',
      includeInRepair === 'true',
      saleId
    )

    if (error) {
      const message =
        (error as { message?: string })?.message || 'Unknown error'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/inventory:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
