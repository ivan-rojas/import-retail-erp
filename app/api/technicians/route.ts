import { NextRequest, NextResponse } from 'next/server'
import {
  createTechnician,
  getTechnicians,
} from '@/lib/database/technicians'
import {
  getCurrentUserServer,
  getUserProfileServer,
  isAdminServer,
} from '@/lib/auth/auth-server'
import { auditCreate, getAuditContext } from '@/lib/database/audit'

export async function GET() {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await getTechnicians()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Error in GET /api/technicians:', error)
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
    if (!profile || !isAdminServer(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: string
      description?: string
    }
    const name = (body.name ?? '').trim()
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const { data, error } = await createTechnician({
      name,
      description: body.description ?? '',
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const auditContext = await getAuditContext()
    if (auditContext && data) {
      await auditCreate('technicians', data.id, data, auditContext)
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/technicians:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

