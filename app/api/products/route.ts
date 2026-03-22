import { NextRequest, NextResponse } from 'next/server'
import { getProducts, createProduct } from '@/lib/database/products'
import { createClient } from '@/utils/supabase/server'
import {
  getCurrentUserServer,
  getUserProfileServer,
  canManageInventoryServer,
} from '@/lib/auth/auth-server'
import { auditCreate, getAuditContext } from '@/lib/database/audit'

export async function GET() {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await getProducts()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/products:', error)
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
    if (!profile || !canManageInventoryServer(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const categoryId = (body.category_id ?? '').toString()
    if (!categoryId) {
      return NextResponse.json(
        { error: 'category_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const categoryRes = await supabase
      .from('product_categories')
      .select('id,name')
      .eq('id', categoryId)
      .maybeSingle()
    if (categoryRes.error || !categoryRes.data) {
      return NextResponse.json(
        { error: 'Categoría inválida' },
        { status: 400 }
      )
    }

    const productData = {
      ...body,
      category_id: categoryRes.data.id,
      category: categoryRes.data.name,
      created_by: user.id,
      base_price: parseFloat(body.base_price || body.basePrice),
    }

    const { data, error } = await createProduct(productData)

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

    await auditCreate('products', data.id, data, auditContext)

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
