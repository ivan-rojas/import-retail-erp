import { NextRequest, NextResponse } from 'next/server'
import {
  deleteTechnician,
  getTechnicianById,
  updateTechnician,
} from '@/lib/database/technicians'
import {
  getCurrentUserServer,
  getUserProfileServer,
  isAdminServer,
} from '@/lib/auth/auth-server'
import { auditDelete, auditUpdate, getAuditContext } from '@/lib/database/audit'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { data, error } = await getTechnicianById(id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/technicians/:id:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const profile = await getUserProfileServer(user.id)
    if (!profile || !isAdminServer(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as {
      name?: string
      description?: string
    }

    const current = await getTechnicianById(id)
    if (current.error) {
      return NextResponse.json({ error: current.error.message }, { status: 500 })
    }
    if (!current.data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data, error } = await updateTechnician(id, body)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const auditContext = await getAuditContext()
    if (auditContext) {
      await auditUpdate('technicians', id, current.data, data, auditContext)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/technicians/:id:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const profile = await getUserProfileServer(user.id)
    if (!profile || !isAdminServer(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const current = await getTechnicianById(id)
    if (current.error) {
      return NextResponse.json({ error: current.error.message }, { status: 500 })
    }
    if (!current.data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { error } = await deleteTechnician(id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const auditContext = await getAuditContext()
    if (auditContext) {
      await auditDelete('technicians', id, {}, auditContext)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/technicians/:id:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

