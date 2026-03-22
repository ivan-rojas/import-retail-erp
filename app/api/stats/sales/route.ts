import { NextResponse } from 'next/server'
import { getSalesStats } from '@/lib/database/stats'
import {
  getCurrentUserServer,
  getUserProfileServer,
  isAdminServer,
} from '@/lib/auth/auth-server'

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

    const { data, error } = await getSalesStats(userId)

    if (error) {
      const message = error?.message ?? (typeof error === 'string' ? error : String(error))
      console.error('[GET /api/stats/sales] getSalesStats failed:', message, error)
      return NextResponse.json(
        { error: message || 'Failed to load sales stats' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    console.error('[GET /api/stats/sales] Unexpected error:', message, stack ?? error)
    return NextResponse.json(
      { error: message || 'Internal server error' },
      { status: 500 }
    )
  }
}
