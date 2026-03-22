export interface Product {
  id: string
  name: string
  type: 'product' | 'accessory'
  category: string
  category_id?: string | null
  category_icon?: string | null
  model: string
  available_colors: string[]
  available_storage?: string[]
  base_price: number
  wholesale_price: number
  description: string
  specifications: Record<string, string>
  status: 'active' | 'inactive' | 'deleted'
  created_at: string
  updated_at: string
  created_by: string
}

export interface CreateProductRequest {
  name: string
  type: 'product' | 'accessory'
  category_id: string
  model: string
  available_colors: string[]
  available_storage?: string[]
  base_price: number
  wholesale_price: number
  description: string
  specifications: Record<string, string>
  status: 'active' | 'inactive' | 'deleted'
}
