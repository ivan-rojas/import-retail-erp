import { NextRequest, NextResponse } from 'next/server'
import {
  deleteProduct,
  getProductById,
  updateProduct,
} from '@/lib/database/products'
import {
  getCurrentUserServer,
  getUserProfileServer,
  canManageInventoryServer,
} from '@/lib/auth/auth-server'
import { auditDelete, auditUpdate, getAuditContext } from '@/lib/database/audit'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data, error } = await getProductById(id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
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

    if (!profile || !canManageInventoryServer(profile)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id } = await params
    const updates: Record<string, unknown> = { ...body }

    if (body.category_id) {
      const supabase = await createClient()
      const categoryRes = await supabase
        .from('product_categories')
        .select('id,name')
        .eq('id', body.category_id)
        .maybeSingle()
      if (categoryRes.error || !categoryRes.data) {
        return NextResponse.json(
          { error: 'Categoría inválida' },
          { status: 400 }
        )
      }
      updates.category_id = categoryRes.data.id
      updates.category = categoryRes.data.name
    }

    const currentProduct = await getProductById(id)
    if (currentProduct.error) {
      return NextResponse.json(
        { error: currentProduct.error.message },
        { status: 500 }
      )
    }
    if (!currentProduct.data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const { data, error } = await updateProduct(id, updates)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const auditContext = await getAuditContext()
    if (!auditContext) {
      return NextResponse.json(
        { error: 'Failed to get audit context' },
        { status: 500 }
      )
    }

    await auditUpdate('products', id, currentProduct.data, data, auditContext)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/products/:id:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfileServer(user.id)
    if (!profile || !canManageInventoryServer(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { error } = await deleteProduct(id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const auditContext = await getAuditContext()
    if (!auditContext) {
      return NextResponse.json(
        { error: 'Failed to get audit context' },
        { status: 500 }
      )
    }

    await auditDelete('products', id, {}, auditContext)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/products/:id:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
