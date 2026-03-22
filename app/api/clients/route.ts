import { NextRequest, NextResponse } from 'next/server'
import { getClients, createClient } from '@/lib/database/clients'
import {
  getCurrentUserServer,
  getUserProfileServer,
} from '@/lib/auth/auth-server'
import { auditCreate, getAuditContext } from '@/lib/database/audit'

export async function GET() {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await getClients()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/clients:', error)
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
    if (!profile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const clientData = {
      ...body,
      created_by: user.id,
    }

    const { data, error } = await createClient(clientData)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    try {
      const auditContext = await getAuditContext()
      if (auditContext) {
        await auditCreate('clients', data.id, data, auditContext)
      } else {
        console.error('Failed to get audit context for client:', data.id)
      }
    } catch (auditError) {
      console.error('Audit logging failed for client:', data.id, auditError)
      // Continue - client was created successfully
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/clients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
