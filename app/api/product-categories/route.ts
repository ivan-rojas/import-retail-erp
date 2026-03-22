import { NextRequest, NextResponse } from 'next/server'
import {
  createProductCategory,
  getProductCategories,
} from '@/lib/database/product-categories'
import {
  canManageInventoryServer,
  getCurrentUserServer,
  getUserProfileServer,
} from '@/lib/auth/auth-server'
import { auditCreate, getAuditContext } from '@/lib/database/audit'

export async function GET() {
  try {
    const user = await getCurrentUserServer()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await getProductCategories()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Error in GET /api/product-categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserServer()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const profile = await getUserProfileServer(user.id)
    if (!profile || !canManageInventoryServer(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: string
      icon?: string
    }
    const name = (body.name ?? '').trim()
    const icon = (body.icon ?? '').trim()
    if (!name || !icon) {
      return NextResponse.json(
        { error: 'name and icon are required' },
        { status: 400 }
      )
    }

    const { data, error } = await createProductCategory({ name, icon })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const auditContext = await getAuditContext()
    if (auditContext && data) {
      await auditCreate('product_categories', data.id, data, auditContext)
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/product-categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

