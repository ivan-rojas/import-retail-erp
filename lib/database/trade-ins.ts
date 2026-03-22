import { createClient } from '../../utils/supabase/server'
import type { TradeInItem } from '../types/inventory'
import { softDeleteProductItems } from './inventory'

// Type for trade-in record creation
export interface TradeInRecord {
  item_id: string
  sale_id: string
  created_by: string
}

// Create trade-in record in database
export const createTradeIn = async (tradeIn: TradeInRecord) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trade_ins')
    .insert(tradeIn)
    .select()
    .single()

  return { data, error }
}

// Get trade-ins for a sale
export const getTradeInsForSale = async (saleId: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trade_ins')
    .select(
      `
      *,
      product_items (
        id,
        name,
        imei,
        color,
        storage,
        cost,
        price,
        condition,
        products (
          name,
          model,
          type
        )
      )
    `
    )
    .eq('sale_id', saleId)

  return { data, error }
}

// Create a new inventory item from trade-in device
export const createInventoryItemFromTradeIn = async (
  tradeIn: TradeInItem,
  sellerId: string,
  batchId?: string
) => {
  const supabase = await createClient()

  // Use the existing product_id from the trade-in
  // No need to create a new product since we're using existing products from the catalog
  const productId = tradeIn.product_id

  // Create the product item
  const { data: productItem, error: itemError } = await supabase
    .from('product_items')
    .insert({
      product_id: productId,
      batch_id: batchId || null,
      name: tradeIn.device_name,
      condition: tradeIn.condition,
      color: tradeIn.color,
      storage: tradeIn.storage || null,
      imei: tradeIn.imei,
      cost: tradeIn.trade_in_value,
      price: tradeIn.products?.base_price || tradeIn.trade_in_value || 0,
      notes: `Parte de Pago ${tradeIn.notes || ''}`.trim(),
      status: 'available',
      created_by: sellerId,
      updated_by: sellerId,
    })
    .select('id')
    .single()

  if (itemError) {
    return { data: null, error: itemError }
  }

  // If it's a used device with specific details, create the used_product_items record
  if (
    tradeIn.condition === 'used' &&
    (tradeIn.battery_health || tradeIn.issues?.length)
  ) {
    const { error: usedItemError } = await supabase
      .from('used_product_items')
      .insert({
        item_id: productItem.id,
        battery_health: tradeIn.battery_health || 100,
        issues: tradeIn.issues || [],
        fixes: [], // No fixes yet for trade-ins
        created_by: sellerId,
        updated_by: sellerId,
      })

    if (usedItemError) {
      // Don't fail the whole operation, just log the error
      console.error(
        'Failed to create used_product_items record:',
        usedItemError
      )
    }
  }

  return { data: productItem, error: null }
}

// Process all trade-ins for a sale
export const processTradeInsForSale = async (
  tradeIns: TradeInItem[],
  saleId: string,
  sellerId: string,
  batchId?: string
) => {
  const createdItems: string[] = []
  const errors: string[] = []

  const defaultBatchId = await getDefaultBatchIdForTradeIn()

  for (const tradeIn of tradeIns) {
    try {
      // Create inventory item for the trade-in
      const { data: inventoryItem, error: inventoryError } =
        await createInventoryItemFromTradeIn(
          tradeIn,
          sellerId,
          batchId || defaultBatchId
        )

      if (inventoryError || !inventoryItem) {
        errors.push(
          `Failed to create inventory for ${tradeIn.device_name} ${tradeIn.model}: ${inventoryError?.message}`
        )
        continue
      }

      // Create trade-in record linking the inventory item to the sale
      const { error: tradeInError } = await createTradeIn({
        item_id: inventoryItem.id,
        sale_id: saleId,
        created_by: sellerId,
      })

      if (tradeInError) {
        errors.push(
          `Failed to create trade-in record for ${tradeIn.device_name} ${tradeIn.model}: ${tradeInError.message}`
        )
        continue
      }

      createdItems.push(inventoryItem.id)
    } catch (error) {
      errors.push(
        `Unexpected error processing trade-in ${tradeIn.device_name} ${tradeIn.model}: ${error}`
      )
    }
  }

  return {
    success: createdItems.length > 0,
    createdItems,
    errors: errors.length > 0 ? errors : null,
  }
}

/** Remove specific trade-in records and soft-delete their linked product items (for sale updates). */
export const removeTradeIns = async (
  tradeIns: { id: string; item_id: string }[]
): Promise<{ error: unknown }> => {
  if (tradeIns.length === 0) return { error: null }
  const itemIds = tradeIns.map((t) => t.item_id)
  const ids = tradeIns.map((t) => t.id)
  const { error: productItemsError } = await softDeleteProductItems(itemIds)
  if (productItemsError) return { error: productItemsError }
  const supabase = await createClient()
  const { error } = await supabase.from('trade_ins').delete().in('id', ids)
  return { error }
}

export const deleteTradeInsForSale = async (saleId: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trade_ins')
    .select('id, item_id')
    .eq('sale_id', saleId)

  if (error) return { error }

  if (data && data.length > 0) {
    const { error: removeError } = await removeTradeIns(data)
    if (removeError) return { error: removeError }
  }
  return { error: null }
}

export const getDefaultBatchIdForTradeIn = async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('batchs')
    .select()
    .eq('name', 'Parte de pago')
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    return null
  }

  if (!data) {
    return null
  }

  return data.id
}
