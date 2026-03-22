export type ProductCategory = {
  id: string
  name: string
  icon: string
  created_at: string
  updated_at: string
}

export type ProductCategoryInsert = {
  name: string
  icon: string
}

export type ProductCategoryUpdate = Partial<ProductCategoryInsert>

