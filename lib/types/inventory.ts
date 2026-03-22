import type { ItemType } from '../enums'
import { Product } from './product'

export type InventoryRow = {
  id: string
  name: string
  color: string
  storage: string | null
  imei: string | null
  price: number
  wholesale_price?: number
  status?: string
  quantity?: number
  products?: {
    model?: string
    type?: ItemType
    release_date?: string
    order?: number
  }
  table: 'product_items' | 'accessory_items' | 'used_product_items'
  batch_id?: string | null
  batch_name?: string | null
  condition?: 'new' | 'used'
  is_on_sale?: boolean
  battery_health?: number
  technician_id?: string | null
  technician?: string
  used_fixes?: Array<{ fix: string; cost: string }>
  total_fix_cost?: number
  trade_in_customer_name?: string
  notes?: string
  created_at?: string
  checked?: boolean
  created_by_full_name?: string
}

export interface InventoryItem {
  id: string
  name: string
  color: string
  storage: string | null
  imei: string | null
  quantity: number
  status: 'available' | 'sold' | 'reserved' | 'deleted'
  price: number
  wholesale_price?: number
  cost: number
  is_on_sale?: boolean
  created_at: string
  updated_at: string
  created_by: string
  products?: Product
  table: 'product_items' | 'accessory_items' | 'used_product_items'
  batch_id?: string | null
  batch_name?: string | null
  condition?: 'new' | 'used' | 'refurbished'
  battery_health?: number
  sale_item_id?: string | null
  notes?: string
}

export interface TradeInItem {
  id: string
  product_id: string
  device_name: string
  model: string
  color: string
  storage?: string
  imei: string
  condition: 'new' | 'used' | 'refurbished'
  battery_health?: number
  issues: string[]
  trade_in_value: number
  notes?: string
  products?: Product
}

export interface CreateInventoryBatchRequest {
  productId: string
  name: string
  color: string
  storage?: string
  price: number
  imeis: string[]
}

// Inventory: create batch or single item(s)
export interface CreateBatchOrItemsRequest {
  mode: 'batch' | 'single'
  batch?: {
    name: string
    description?: string
    date: string // YYYY-MM-DD
  }
  itemType: 'device' | 'accessory'
  product_id: string
  batch_id?: string | null
  name: string
  color: string
  storage?: string | null
  price: number
  wholesale_price?: number
  cost?: number
  imeis?: string[] // for device
  quantity?: number // for accessory
  condition?: 'new' | 'used'
  notes?: string
  is_on_sale?: boolean
  usedDetails?: {
    battery_health?: number
    issues?: string[]
    fixes?: Array<{ fix: string; cost: string }>
  }
}

export interface Batch {
  id: string
  name: string
  description?: string | null
  date: string
  status: 'active' | 'inactive' | 'deleted'
  created_at: string
  updated_at: string
}

export type ProductSummary = {
  id: string
  name: string
  type: 'product' | 'accessory'
  category: string
  model: string
  available_colors?: string[]
  available_storage?: string[] | null
  release_date?: string
  order?: number
}

export type ProductItemRow = {
  id: string
  batch_id?: string | null
  batchs?: { id: string; name: string } | null
  name: string
  color: string
  storage: string | null
  imei: string | null
  cost: number
  price: number
  wholesale_price?: number
  status: string
  is_on_sale?: boolean
  notes?: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  created_by_profile: { full_name: string } | null
  products?: ProductSummary
  used_product_items?: Array<{
    id: string
    technician_id?: string | null
    technicians?: { id: string; name: string } | null
    battery_health?: number
    issues?: string[]
    fixes?: string[]
    created_at?: string
    updated_at?: string
    created_by?: string
    updated_by?: string
  }>
  trade_ins?: Array<{
    id: string
    sale_id: string
    sales?: {
      id: string
      customer_name: string
      status: string
    }
  }>
}

export type AccessoryItemRow = {
  id: string
  batch_id?: string | null
  batchs?: { id: string; name: string } | null
  cost: number
  name: string
  color: string
  quantity: number
  price: number
  wholesale_price?: number
  status: string
  is_on_sale?: boolean
  notes?: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  created_by_profile: { full_name: string } | null
  products?: Pick<ProductSummary, 'id' | 'name' | 'type' | 'category' | 'model'>
}
