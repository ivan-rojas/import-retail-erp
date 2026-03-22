import { AccessoryItem } from './accessory-item'
import { ProductItem } from './product-item'

/** Discriminator for sale line: device (inventory), accessory (inventory), service (non-inventory). */
export type SaleLineType = 'device' | 'accessory' | 'service'

export interface SaleItem {
  id: string
  item_name: string
  item_model: string
  item_price: number
  item_quantity: number
  item_notes?: string | null
  product_item_id?: string | null
  accessory_item_id?: string | null
  /** Explicit line type; prefer over inferring from FKs. */
  sale_line_type?: SaleLineType | null
  /** Line-level cost for service (and future part) lines; NULL for device/accessory (cost from linked item). */
  item_cost?: number | null
  /** Optional link to the device (IMEI) this service is for; no stock impact. */
  linked_product_item_id?: string | null

  // Related product/accessory data
  product_items?: ProductItem | null
  accessory_items?: AccessoryItem | null
}
