import { NextRequest, NextResponse } from 'next/server'
import { getClientBalanceDetails } from '@/lib/database/clients'
import { getCurrentUserServer } from '@/lib/auth/auth-server'

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
    const { data, error } = await getClientBalanceDetails(id)

    if (error) {
      console.error('Error fetching client balance:', error)
      return NextResponse.json(
        { error: 'Failed to fetch client balance' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/clients/:id/balance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
