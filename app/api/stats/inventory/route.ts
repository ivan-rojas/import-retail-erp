import { NextResponse } from 'next/server'
import { getInventoryStats } from '@/lib/database/stats'
import { getCurrentUserServer } from '@/lib/auth/auth-server'

export async function GET() {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await getInventoryStats()

    if (error) {
      return NextResponse.json({ error: error }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/stats/inventory:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
