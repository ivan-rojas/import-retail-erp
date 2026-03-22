import { Delivery } from './delivery'
import { Payment } from './payment'
import { TradeIn } from './trade-ins'
import { Reservation } from './reservation'
import { SaleItem } from './sale-item'

export interface Sale {
  id: string
  customer_name: string
  customer_ig?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  customer_alias_cbu?: string | null
  client_id?: string | null
  status: 'sold' | 'reserved' | 'cancelled' | 'deleted'
  subtotal_price: number
  sale_price: number
  sale_date: string
  notes?: string | null
  seller_id: string
  seller_name: string
  created_at: string
  updated_at: string
  created_by: string
  updated_by?: string | null

  // Related data
  payments?: Payment[]
  deliveries?: Delivery[]
  reservations?: Reservation[]
  sale_items?: SaleItem[]
  trade_ins?: TradeIn[]
}

// DTO for reading sales with all relations flattened for the UI
export interface SaleDTO extends Sale {
  // Override to ensure these are arrays
  payments: Payment[]
  deliveries: Delivery[]
  reservations: Reservation[]
  sale_items: SaleItem[]
  trade_ins: TradeIn[]

  // Computed fields for easier frontend use
  primary_payment?: Payment | null
  is_reservation: boolean
  payment_method?: string | null // Primary payment method
  product_model?: string // Primary product model
  product_name?: string // Primary product name
  imei?: string | null // Primary product IMEI
  has_trade_ins: boolean
  delivery_status?: string | null
  delivery_date?: string | null
  total_products: number // Number of different products
  total_quantity: number // Total quantity of items
  total_price: number // Total price of the sale
  subtotal_price: number // Subtotal price of the sale
}

// Type for the raw Supabase query result
export type RawSaleData = {
  id: string
  customer_name: string
  customer_ig?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  customer_alias_cbu?: string | null
  client_id?: string | null
  status: 'sold' | 'reserved' | 'cancelled' | 'deleted'
  subtotal_price: number
  sale_price: number
  sale_date: string
  notes?: string | null
  seller_id: string
  seller_name: string
  created_at: string
  updated_at: string
  created_by: string
  updated_by?: string | null
  sale_items?: Array<{
    id: string
    item_name: string
    item_model: string
    item_price: number
    item_quantity: number
    item_notes?: string | null
    product_item_id?: string | null
    accessory_item_id?: string | null
    sale_line_type?: 'device' | 'accessory' | 'service' | null
    item_cost?: number | null
    linked_product_item_id?: string | null
    product_items?: {
      id: string
      imei: string
      color: string
      storage?: string | null
      condition: 'new' | 'used' | 'refurbished'
    } | null
    accessory_items?: {
      id: string
      color: string
      quantity: number
    } | null
  }>
  payments?: Array<{
    id: string
    base_amount: number
    amount: number
    payment_method: 'cash' | 'transfer' | 'crypto'
    currency: 'USD' | 'ARS'
    usd_exchange_rate: number
    payment_date: string
    payment_notes?: string | null
    surcharge_percentage?: number
    converted_amount?: number
    amount_tendered?: number
    change_amount?: number
  }>
  deliveries?: Array<{
    id: string
    delivery_date: string
    delivery_notes?: string | null
    delivery_status: 'pending' | 'delivered' | 'cancelled'
    delivery_user_id: string
  }>
  reservations?: Array<{
    id: string
    deposit: number
    status: 'pending' | 'confirmed' | 'cancelled'
    created_at: string
    updated_at: string
    created_by: string
    updated_by?: string | null
  }>
  trade_ins?: Array<{
    id: string
    item_id: string
    product_items?: {
      id: string
      name: string
      imei: string
      color: string
      storage?: string | null
      condition: 'new' | 'used' | 'refurbished'
      price: number
      cost: number
    } | null
  }>
}
