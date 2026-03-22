import { Product } from './product'

export interface ProductItem {
  id: string
  imei: string
  color: string
  storage?: string | null
  condition: 'new' | 'used' | 'refurbished'
  cost: number
  price: number
  wholesale_price: number
  notes?: string | null
  status: 'available' | 'sold' | 'reserved' | 'deleted'
  is_on_sale: boolean
  batch_id?: string | null
  batchs?: { id: string; name: string } | null
  name: string
  products?: Product
}

export interface UsedProductItem extends ProductItem {
  battery_health: number
  issues: string[]
  fixes: string[]
}
