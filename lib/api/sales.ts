import type { Sale, SaleDTO } from '@/lib/types/sales'
import { PaymentDTO } from '@/lib/types/payment'
import { InventoryItem } from '../types/inventory'

export class SalesApi {
  constructor(
    private request: <T>(endpoint: string, options?: RequestInit) => Promise<T>
  ) {}

  async getSales(): Promise<SaleDTO[]> {
    return this.request('/sales')
  }

  async getSaleById(id: string): Promise<SaleDTO> {
    return this.request(`/sales/${id}`)
  }

  async createSale(data: SaleDTO): Promise<Sale> {
    return this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSale(id: string, data: SaleDTO): Promise<Sale> {
    return this.request(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSale(id: string): Promise<void> {
    return this.request(`/sales/${id}`, {
      method: 'DELETE',
    })
  }

  async completeSale(
    id: string,
    data: PaymentDTO | PaymentDTO[],
    savePayments: boolean
  ): Promise<void> {
    return this.request(`/sales/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ data, savePayments }),
    })
  }

  async getInventoryItemsForSale(): Promise<InventoryItem[]> {
    return this.request('/sales/inventory-items')
  }
}
