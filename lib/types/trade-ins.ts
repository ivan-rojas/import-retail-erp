import { UsedProductItem } from './product-item'

export interface TradeIn {
  id: string
  item_id: string
  product_items?: UsedProductItem | null
}
