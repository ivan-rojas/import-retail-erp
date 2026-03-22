import { NextResponse } from 'next/server'
import { getProfitsStats } from '@/lib/database/stats'
import {
  getCurrentUserServer,
  getUserProfileServer,
  isAdminServer,
} from '@/lib/auth/auth-server'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfileServer(user.id)
    if (!profile || !isAdminServer(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')

    // Validate date parameters
    if (fromDate && isNaN(Date.parse(fromDate))) {
      return NextResponse.json(
        { error: 'Invalid from date parameter' },
        { status: 400 }
      )
    }
    if (toDate && isNaN(Date.parse(toDate))) {
      return NextResponse.json(
        { error: 'Invalid to date parameter' },
        { status: 400 }
      )
    }

    const { data, error } = await getProfitsStats(
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined
    )

    if (error) {
      return NextResponse.json({ error: error }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/stats/profits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
