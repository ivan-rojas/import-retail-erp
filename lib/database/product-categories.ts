import { createClient } from '@/utils/supabase/server'
import type {
  ProductCategoryInsert,
  ProductCategoryUpdate,
} from '@/lib/types/product-category'

export const getProductCategories = async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .order('name', { ascending: true })
  return { data, error }
}

export const getProductCategoryById = async (id: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return { data, error }
}

export const createProductCategory = async (payload: ProductCategoryInsert) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_categories')
    .insert({
      name: payload.name.trim().toLowerCase(),
      icon: payload.icon,
    })
    .select('*')
    .single()
  return { data, error }
}

export const updateProductCategory = async (
  id: string,
  payload: ProductCategoryUpdate
) => {
  const supabase = await createClient()
  const updates: Record<string, unknown> = {}
  if (typeof payload.name === 'string') updates.name = payload.name.trim().toLowerCase()
  if (typeof payload.icon === 'string') updates.icon = payload.icon
  const { data, error } = await supabase
    .from('product_categories')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle()
  return { data, error }
}

export const deleteProductCategory = async (id: string) => {
  const supabase = await createClient()
  const { error } = await supabase.from('product_categories').delete().eq('id', id)
  return { error }
}

