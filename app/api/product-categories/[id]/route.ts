import { NextRequest, NextResponse } from 'next/server'
import {
  deleteProductCategory,
  getProductCategoryById,
  updateProductCategory,
} from '@/lib/database/product-categories'
import {
  canManageInventoryServer,
  getCurrentUserServer,
  getUserProfileServer,
} from '@/lib/auth/auth-server'
import { auditDelete, auditUpdate, getAuditContext } from '@/lib/database/audit'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserServer()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { data, error } = await getProductCategoryById(id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/product-categories/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserServer()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const profile = await getUserProfileServer(user.id)
    if (!profile || !canManageInventoryServer(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as {
      name?: string
      icon?: string
    }

    const current = await getProductCategoryById(id)
    if (current.error) return NextResponse.json({ error: current.error.message }, { status: 500 })
    if (!current.data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data, error } = await updateProductCategory(id, body)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const auditContext = await getAuditContext()
    if (auditContext) {
      await auditUpdate('product_categories', id, current.data, data, auditContext)
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/product-categories/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserServer()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const profile = await getUserProfileServer(user.id)
    if (!profile || !canManageInventoryServer(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const current = await getProductCategoryById(id)
    if (current.error) return NextResponse.json({ error: current.error.message }, { status: 500 })
    if (!current.data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const supabase = await createClient()
    const inUseRes = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
      .neq('status', 'deleted')

    if (inUseRes.error) {
      return NextResponse.json({ error: inUseRes.error.message }, { status: 500 })
    }

    if ((inUseRes.count ?? 0) > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar la categoría porque está en uso por ${inUseRes.count} producto(s).`,
        },
        { status: 409 }
      )
    }

    const { error } = await deleteProductCategory(id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const auditContext = await getAuditContext()
    if (auditContext) {
      await auditDelete('product_categories', id, {}, auditContext)
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/product-categories/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

