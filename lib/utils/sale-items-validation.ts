import type { SaleLineType } from '@/lib/types/sale-item'

/** Sale item payload as sent from API/form (partial; only fields needed for validation). */
type SaleItemPayload = {
  id?: string
  sale_line_type?: SaleLineType | null
  product_item_id?: string | null
  accessory_item_id?: string | null
  item_cost?: number | null
  linked_product_item_id?: string | null
  item_name?: string
  item_price?: number
  item_quantity?: number
}

export type SaleItemsValidationResult =
  | { valid: true }
  | { valid: false; error: string }

/**
 * Validates sale_items for updateSale/processSale.
 * - Service: item_cost required; product_item_id and accessory_item_id must be null/absent.
 * - Device: product_item_id required; accessory_item_id null.
 * - Accessory: accessory_item_id required; product_item_id null.
 */
export function validateSaleItems(
  items: SaleItemPayload[] | undefined | null
): SaleItemsValidationResult {
  if (!items || !Array.isArray(items)) return { valid: true }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const lineType: SaleLineType =
      item.sale_line_type ??
      (item.product_item_id ? 'device' : item.accessory_item_id ? 'accessory' : 'service')

    if (lineType === 'service') {
      const cost = item.item_cost
      if (cost == null || !Number.isFinite(Number(cost))) {
        return {
          valid: false,
          error: `Sale item ${i + 1}: service line requires item_cost`,
        }
      }
      if (item.product_item_id != null && item.product_item_id !== '') {
        return {
          valid: false,
          error: `Sale item ${i + 1}: service line must not have product_item_id`,
        }
      }
      if (item.accessory_item_id != null && item.accessory_item_id !== '') {
        return {
          valid: false,
          error: `Sale item ${i + 1}: service line must not have accessory_item_id`,
        }
      }
    } else if (lineType === 'device') {
      if (!item.product_item_id) {
        return {
          valid: false,
          error: `Sale item ${i + 1}: device line requires product_item_id`,
        }
      }
      if (item.accessory_item_id != null && item.accessory_item_id !== '') {
        return {
          valid: false,
          error: `Sale item ${i + 1}: device line must not have accessory_item_id`,
        }
      }
    } else {
      // accessory
      if (!item.accessory_item_id) {
        return {
          valid: false,
          error: `Sale item ${i + 1}: accessory line requires accessory_item_id`,
        }
      }
      if (item.product_item_id != null && item.product_item_id !== '') {
        return {
          valid: false,
          error: `Sale item ${i + 1}: accessory line must not have product_item_id`,
        }
      }
    }
  }

  return { valid: true }
}
