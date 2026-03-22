import type { Product, CreateProductRequest } from '@/lib/types/product'

export class ProductsApi {
  constructor(
    private request: <T>(endpoint: string, options?: RequestInit) => Promise<T>
  ) {}

  async getProducts(): Promise<Product[]> {
    return this.request('/products')
  }

  async getProductById(id: string): Promise<Product> {
    return this.request(`/products/${id}`)
  }

  async createProduct(data: CreateProductRequest): Promise<Product> {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProduct(
    id: string,
    data: Partial<CreateProductRequest>
  ): Promise<Product> {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    })
  }
}
