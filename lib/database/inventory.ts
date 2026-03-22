import { createClient } from '../../utils/supabase/server'

import { AccessoryItemRow, ProductItemRow } from '@/lib/types/inventory'
import { getMappedInventoryItems } from '../utils/inventory'
// Note: used_product_items is embedded via left join in product_items queries

/** Exclude product items that are trade-ins linked to a sale with status !== 'sold' (e.g. reservations). */
export const filterOutNonSoldTradeInItems = (
  items: ProductItemRow[] | null
): ProductItemRow[] => {
  if (!items?.length) return items ?? []
  return items.filter((item) => {
    const tradeIns = item.trade_ins
    if (!tradeIns?.length) return true
    return tradeIns.every((t) => t.sales?.status === 'sold')
  })
}

/** Returns product_item_ids that belong to the given sale (so they can be re-added when editing). */
async function getProductItemIdsInSale(saleId: string): Promise<Set<string>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('sale_reservation_items')
    .select('product_item_id')
    .eq('sale_id', saleId)
    .not('product_item_id', 'is', null)
  const ids = new Set((data ?? []).map((r) => r.product_item_id as string))
  return ids
}

export const getInventoryItemsQuery = async (
  excludeUnavailable = false,
  includeInRepair = false,
  /** When editing a sale: fetch all product items so we can include same-sale items in getInventoryItems. */
  saleId?: string | null
) => {
  const supabase = await createClient()

  // When saleId is provided we need all product items to merge with same-sale filter in getInventoryItems
  const skipProductStatusFilter = Boolean(saleId)

  // product_items with product relationship
  let productItemsQuery = supabase
    .from('product_items')
    .select(
      `
      id,
      batch_id,
      name,
      color,
      storage,
      imei,
      cost,
      price,
      wholesale_price,
      status,
      notes,
      is_on_sale,
      created_at,
      updated_at,
      created_by,
      updated_by,
      products:product_id (
        id,
        name,
        type,
        category,
        model,
        available_colors,
        available_storage
      ),
      created_by_profile:created_by (
        full_name
      )
    `
    )
    .neq('status', 'deleted')

  if (excludeUnavailable && !skipProductStatusFilter) {
    productItemsQuery = productItemsQuery[includeInRepair ? 'in' : 'eq'](
      'status',
      includeInRepair ? ['available', 'in-repair'] : 'available'
    )
  }

  let accessoryItemsQuery = supabase
    .from('accessory_items')
    .select(
      `
      id,
      batch_id,
      name,
      color,
      quantity,
      cost,
      price,
      wholesale_price,
      status,
      notes,
      is_on_sale,
      created_at,
      updated_at,
      created_by,
      updated_by,
      products:product_id (
        id,
        name,
        type,
        category,
        model
      ),
      batchs:batch_id (
        id,
        name
      ),
      created_by_profile:created_by (
        full_name
      )
    `
    )
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })

  if (excludeUnavailable) {
    accessoryItemsQuery = accessoryItemsQuery[includeInRepair ? 'in' : 'eq'](
      'status',
      includeInRepair ? ['available', 'in-repair'] : 'available'
    ).gt('quantity', 0)
  }

  // Embed used details via left join on product_items
  const productItemsWithUsedQuery = productItemsQuery.select(
    `
    *,
    products:product_id (
      id,
      name,
      type,
      category,
      model,
      available_colors,
      available_storage,
      release_date,
      "order"
    ),
    batchs:batch_id ( id, name ),
    created_by_profile:created_by ( full_name ),
    used_product_items (
      id,
      battery_health,
      issues,
      fixes,
      technician_id,
      technicians:technician_id (
        id,
        name
      ),
      created_at,
      updated_at,
      created_by,
      updated_by
    ),
    trade_ins (
      id,
      sale_id,
      sales:sale_id (
        id,
        customer_name,
        status
      )
    )
  `
  )

  return {
    productItemsWithUsedQuery,
    accessoryItemsQuery,
  }
}

// Inventory Items
// Consolidated inventory across product_items, accessory_items, and used_product_items
export const getInventoryItems = async (
  excludeUnavailable = false,
  includeInRepair = false,
  /** When editing a sale: include items that are sold/reserved to this sale so they can be re-added. */
  saleId?: string | null
) => {
  const { productItemsWithUsedQuery, accessoryItemsQuery } =
    await getInventoryItemsQuery(
      excludeUnavailable,
      includeInRepair,
      saleId ?? undefined
    )

  const [sameSaleProductIds, responses] = await Promise.all([
    saleId ? getProductItemIdsInSale(saleId) : Promise.resolve(new Set<string>()),
    Promise.all([productItemsWithUsedQuery, accessoryItemsQuery]),
  ])

  const productResp = responses[0] as {
    data: ProductItemRow[] | null
    error: unknown
  }
  const accessoryResp = responses[1] as {
    data: AccessoryItemRow[] | null
    error: unknown
  }
  // No separate used response; included in product items

  let productItems = productResp.data ?? []
  const productError = productResp.error
  const accessoryItems = accessoryResp.data
  const accessoryError = accessoryResp.error
  // embedded used details; keep variables for interface consistency if needed

  const error = productError || accessoryError || null

  // When saleId is set, include items that are in this sale (sold/reserved to it) so user can re-add
  if (saleId && sameSaleProductIds.size > 0) {
    const isAllowed = (item: ProductItemRow) => {
      const available =
        item.status === 'available' ||
        (includeInRepair && item.status === 'in-repair')
      return available || sameSaleProductIds.has(item.id)
    }
    productItems = productItems.filter(isAllowed)
  }

  const productItemsFiltered = filterOutNonSoldTradeInItems(productItems)

  // Sort product items by products.release_date, products.order, battery_health, then created_at
  const sortedProductItems = productItemsFiltered.sort((a, b) => {
    const productA = a.products
    const productB = b.products

    // First sort by release_date (ascending)
    if (productA?.release_date && productB?.release_date) {
      const dateA = new Date(productA.release_date).getTime()
      const dateB = new Date(productB.release_date).getTime()
      if (dateA !== dateB) {
        return dateA - dateB
      }
    } else if (productA?.release_date && !productB?.release_date) {
      return -1
    } else if (!productA?.release_date && productB?.release_date) {
      return 1
    }

    // Then sort by order (ascending)
    if (productA?.order !== undefined && productB?.order !== undefined) {
      if (productA.order !== productB.order) {
        return (productA.order ?? 0) - (productB.order ?? 0)
      }
    } else if (productA?.order !== undefined && productB?.order === undefined) {
      return -1
    } else if (productA?.order === undefined && productB?.order !== undefined) {
      return 1
    }

    // Then sort by battery_health (descending). New items (no used_product_items) count as 100
    const batteryA =
      a.used_product_items && a.used_product_items.length > 0
        ? (a.used_product_items[0].battery_health ?? 100)
        : 100
    const batteryB =
      b.used_product_items && b.used_product_items.length > 0
        ? (b.used_product_items[0].battery_health ?? 100)
        : 100
    if (batteryA !== batteryB) {
      return batteryB - batteryA
    }

    // Finally sort by created_at (ascending)
    const createdA = new Date(a.created_at).getTime()
    const createdB = new Date(b.created_at).getTime()
    return createdA - createdB
  })

  const mapped = getMappedInventoryItems(
    sortedProductItems,
    accessoryItems ?? []
  )

  return { data: mapped, error }
}

export const getInventoryItemById = async (id: string) => {
  const supabase = await createClient()
  // Always resolve via product_items (with embedded used details) or accessory_items
  const { data: productOrUsed } = await supabase
    .from('product_items')
    .select(
      `
      *,
      products:product_id (
        name,
        type,
        category,
        model,
        available_colors,
        available_storage,
        specifications
      ),
      used_product_items (
        id,
        battery_health,
        issues,
        fixes,
        technician_id,
        technicians:technician_id (
          id,
          name
        ),
        created_at,
        updated_at,
        created_by,
        updated_by
      )
    `
    )
    .eq('id', id)
    .maybeSingle()

  if (productOrUsed) {
    return { data: productOrUsed, error: null }
  }

  const { data: accessoryItem, error: accError } = await supabase
    .from('accessory_items')
    .select(
      `
      *,
      products:product_id (
        name,
        type,
        category,
        model
      )
    `
    )
    .eq('id', id)
    .maybeSingle()

  return { data: accessoryItem, error: accError }
}

export const findProductItemByIMEI = async (
  imei: string,
  excludeUnavailable = false,
  excludeDeleted = false,
  includeInRepair = false,
  /** When editing a sale: allow re-adding a device that is sold/reserved to this same sale. */
  saleId?: string | null
) => {
  const supabase = await createClient()
  let query = supabase
    .from('product_items')
    .select(
      `
      id,
      batch_id,
      name,
      color,
      storage,
      imei,
      cost,
      price,
      wholesale_price,
      status,
      condition,
      is_on_sale,
      notes,
      created_at,
      updated_at,
      created_by,
      products:product_id (
        id,
        name,
        model,
        type,
        category,
        available_colors,
        available_storage
      ),
      batchs:batch_id ( id, name )
    `
    )
    .eq('imei', imei)

  // When saleId is provided we fetch by IMEI first, then allow same-sale items below
  if (excludeUnavailable && !saleId) {
    query = query[includeInRepair ? 'in' : 'eq'](
      'status',
      includeInRepair ? ['available', 'in-repair'] : 'available'
    )
  }
  if (excludeDeleted) query = query.neq('status', 'deleted')

  const { data, error } = await query.maybeSingle()

  if (error) return { data: null, error }
  if (!data) return { data: null, error: null }

  // If we exclude unavailable and have no saleId, we already filtered by status
  const isAvailable =
    data.status === 'available' ||
    (includeInRepair && data.status === 'in-repair')
  if (excludeUnavailable && !isAvailable) {
    if (!saleId) return { data: null, error: null }
    // Editing a sale: allow re-adding if this device belongs to this sale
    const { data: saleItem } = await supabase
      .from('sale_reservation_items')
      .select('id')
      .eq('sale_id', saleId)
      .eq('product_item_id', data.id)
      .maybeSingle()
    if (!saleItem) return { data: null, error: null }
  }

  const mapped = {
    id: data.id,
    name: data.name,
    color: data.color,
    storage: data.storage,
    imei: data.imei,
    cost: data.cost,
    price: data.price,
    wholesale_price: data.wholesale_price,
    status: data.status,
    quantity: 1,
    created_at: data.created_at,
    updated_at: data.updated_at,
    created_by: data.created_by,
    products: data.products,
    table: data.condition === 'used' ? 'used_product_items' : 'product_items',
    batch_id: data.batch_id ?? null,
    batch_name: Array.isArray(data.batchs)
      ? (data.batchs[0]?.name ?? null)
      : ((data.batchs as { id: string; name: string } | null)?.name ?? null),
    condition: data.condition === 'used' ? 'used' : 'new',
    is_on_sale: data.is_on_sale,
  }

  return { data: mapped, error: null }
}

// Direct table updates
export const updateProductItem = async (
  id: string,
  updates: Record<string, unknown>
) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_items')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle()

  return { data, error }
}

export const updateAccessoryItem = async (
  id: string,
  updates: Record<string, unknown>
) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accessory_items')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle()

  return { data, error }
}

export const updateUsedProductItem = async (
  id: string,
  updates: Record<string, unknown>
) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('used_product_items')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle()

  return { data, error }
}

export const getUsedProductItemByItemId = async (itemId: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('used_product_items')
    .select('id, item_id')
    .eq('item_id', itemId)
    .maybeSingle()

  return { data, error }
}

export const softDeleteProductItems = async (ids: Array<string>) => {
  const supabase = await createClient()
  const { error } = await supabase
    .from('product_items')
    .update({ status: 'deleted' })
    .in('id', ids)
  return { error }
}

export const softDeleteAccessoryItems = async (ids: Array<string>) => {
  const supabase = await createClient()
  const { error } = await supabase
    .from('accessory_items')
    .update({ status: 'deleted' })
    .in('id', ids)
  return { error }
}
