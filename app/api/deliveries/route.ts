import { NextRequest, NextResponse } from 'next/server'
import { createDelivery, getDeliveries } from '@/lib/database/deliveries'
import {
  canSellServer,
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

    const { data, error } = await getDeliveries(userId)

    if (error) {
      console.error('Error fetching deliveries:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching deliveries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfileServer(user.id)
    if (!profile || !canSellServer(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { data, error } = await createDelivery({
      ...body,
      created_by: user.id,
      updated_by: user.id,
    })

    if (error) {
      console.error('Error creating delivery:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/deliveries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
