import { Product } from './product'

export interface AccessoryItem {
  id: string
  color: string
  quantity: number
  products?: Product
  is_on_sale: boolean
}
