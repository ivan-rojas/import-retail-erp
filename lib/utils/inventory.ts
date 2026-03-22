import {
  AccessoryItemRow,
  ProductItemRow,
  InventoryRow,
} from '../types/inventory'

export const getMappedInventoryItems = (
  productItems?: ProductItemRow[],
  accessoryItems?: AccessoryItemRow[]
) => {
  const mapped = [
    ...(productItems || []).map((pi: ProductItemRow) => ({
      id: pi.id,
      name: pi.name,
      color: pi.color,
      storage: pi.storage,
      imei: pi.imei,
      cost: pi.cost,
      price: pi.price,
      wholesale_price: pi.wholesale_price,
      status: pi.status,
      is_on_sale: pi.is_on_sale,
      quantity: 1,
      notes: pi.notes,
      created_at: pi.created_at,
      updated_at: pi.updated_at,
      created_by: pi.created_by,
      created_by_full_name: pi.created_by_profile?.full_name ?? null,
      products: pi.products,
      table:
        pi.used_product_items && pi.used_product_items.length > 0
          ? 'used_product_items'
          : 'product_items',
      batch_id: pi.batch_id ?? null,
      batch_name: pi.batchs?.name ?? null,
      technician:
        pi.used_product_items && pi.used_product_items.length > 0
          ? (pi.used_product_items[0].technicians?.name ?? undefined)
          : undefined,
      technician_id:
        pi.used_product_items && pi.used_product_items.length > 0
          ? (pi.used_product_items[0].technician_id ?? undefined)
          : undefined,
      // Attach used details when available for consumers that need it
      battery_health:
        pi.used_product_items && pi.used_product_items[0]
          ? pi.used_product_items[0].battery_health
          : undefined,
      used_fixes:
        pi.used_product_items && pi.used_product_items.length > 0
          ? (() => {
              const fixes = pi.used_product_items?.[0]?.fixes
              if (!fixes || !Array.isArray(fixes)) return undefined
              return fixes
                .map((fix: string) => {
                  try {
                    return JSON.parse(fix) as { fix: string; cost: string }
                  } catch {
                    return null
                  }
                })
                .filter((f): f is { fix: string; cost: string } => f !== null)
            })()
          : undefined,
      total_fix_cost:
        pi.used_product_items && pi.used_product_items.length > 0
          ? (() => {
              const fixes = pi.used_product_items?.[0]?.fixes
              if (!fixes || !Array.isArray(fixes)) return undefined
              return fixes.reduce((total, fixStr) => {
                try {
                  const fix = JSON.parse(fixStr) as {
                    fix: string
                    cost: string
                  }
                  return total + (Number(fix.cost) || 0)
                } catch {
                  return total
                }
              }, 0)
            })()
          : undefined,
      condition:
        pi.used_product_items && pi.used_product_items.length > 0
          ? 'used'
          : 'new',
      release_date: pi.products?.release_date ?? null,
      order: pi.products?.order ?? null,
      trade_in_customer_name:
        pi.trade_ins && pi.trade_ins.length > 0
          ? (() => {
              // Find trade_in with sale status 'sold' or 'reserved'
              const tradeIn = pi.trade_ins.find(
                (ti) =>
                  ti.sales &&
                  (ti.sales.status === 'sold' || ti.sales.status === 'reserved')
              )
              return tradeIn?.sales?.customer_name ?? undefined
            })()
          : undefined,
    })),
    ...(accessoryItems || []).map((ai: AccessoryItemRow) => ({
      id: ai.id,
      name: ai.name,
      color: ai.color,
      cost: ai.cost,
      storage: null,
      price: ai.price,
      wholesale_price: ai.wholesale_price,
      status: ai.status,
      is_on_sale: ai.is_on_sale,
      quantity: ai.quantity,
      notes: ai.notes,
      created_at: ai.created_at,
      updated_at: ai.updated_at,
      created_by: ai.created_by,
      created_by_full_name: ai.created_by_profile?.full_name ?? null,
      products: ai.products,
      table: 'accessory_items' as const,
      batch_id: ai.batch_id ?? null,
      batch_name: ai.batchs?.name ?? null,
    })),
    // Used products are represented via product_items rows with used details above
  ]
  return mapped
}

/** Parse storage string (e.g. "64GB", "256GB", "1TB") to a numeric value for sorting (smallest first). */
export const parseStorageToNumber = (storage: string): number => {
  if (!storage || storage === 'SIN ALMACENAMIENTO') return 0
  const match = storage.trim().match(/^(\d+(?:\.\d+)?)\s*(GB|TB)$/i)
  if (!match) return 0
  const num = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  return unit === 'TB' ? num * 1024 : num
}
