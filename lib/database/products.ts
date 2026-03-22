import { createClient } from '../../utils/supabase/server'

// Product Definitions
export const getProducts = async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      product_categories:category_id (
        id,
        name,
        icon
      )
    `
    )
    .neq('status', 'deleted')
    .order('type', { ascending: true })
    .order('release_date', { ascending: false })
    .order('order', { ascending: true })

  const mapped = (data ?? []).map((item: any) => ({
    ...item,
    category: item.product_categories?.name ?? item.category,
    category_icon: item.product_categories?.icon ?? null,
  }))

  return { data: mapped, error }
}

export const getProductById = async (id: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      product_categories:category_id (
        id,
        name,
        icon
      )
    `
    )
    .eq('id', id)
    .maybeSingle()

  const mapped = data
    ? {
        ...data,
        category: (data as any).product_categories?.name ?? (data as any).category,
        category_icon: (data as any).product_categories?.icon ?? null,
      }
    : null

  return { data: mapped, error }
}

export const createProduct = async (product: Record<string, unknown>) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()

  return { data, error }
}

export const updateProduct = async (
  id: string,
  updates: Record<string, unknown>
) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle()

  return { data, error }
}

export const deleteProduct = async (id: string) => {
  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({ status: 'deleted' })
    .eq('id', id)

  return { error }
}
