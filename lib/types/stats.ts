export interface DashboardStats {
  inventory?: InventoryStats
  sales?: SalesStats
}

export interface InventoryStats {
  totalItems: number
  totalValue: number
  totalCost: number
  lowStockItems: number
  outOfStockItems: number
  totalProducts: number
  productsStock: ProductStock[]
}

export interface ProductStock {
  productId: string
  productName: string
  productModel?: string
  totalQuantity: number
  totalValue: number
  variants: ProductVariant[]
}

export interface ProductVariant {
  color: string
  storage: string | null
  condition?: string
  quantity: number
  price: number
}

export interface SalesStats {
  lastYear: SaleStat[]
  currentMonth: SaleStat
  total: SaleStat
}

export interface SaleStat {
  sales: number
  revenue: number
  profit?: number
  cost?: number
  reservations: number
  transactions: number
}

export interface ProfitItem {
  id: string
  item_name: string
  item_model: string
  item_quantity: number
  sale_price: number
  cost: number
  profit: number
  profit_margin: number
  sale_id: string
  sale_date: string
  customer_name: string
  seller_name: string
  item_type: 'product' | 'accessory' | 'service'
  delivery_date: string
  delivery_is_default?: boolean
  product_item_id?: string | null
  accessory_item_id?: string | null
  /** Set for service lines linked to a device; used to aggregate into product row. */
  linked_product_item_id?: string | null
  condition?: 'new' | 'used'
}

export interface ProfitsStats {
  items: ProfitItem[]
  totalProfit: number
  totalRevenue: number
  totalCost: number
  averageProfitMargin: number
}
