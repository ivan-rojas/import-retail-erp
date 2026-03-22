import type {
  InventoryItem,
  CreateInventoryBatchRequest,
  CreateBatchOrItemsRequest,
  Batch,
} from '@/lib/types/inventory'

export class InventoryApi {
  constructor(
    private request: <T>(
      endpoint: string,
      options?: RequestInit & { query?: Record<string, string> }
    ) => Promise<T>
  ) {}

  async getInventory(
    excludeUnavailable = false,
    includeInRepair = false,
    saleId?: string | null
  ): Promise<InventoryItem[]> {
    const params = new URLSearchParams({
      excludeUnavailable: String(excludeUnavailable),
      includeInRepair: String(includeInRepair),
    })
    if (saleId) params.set('saleId', saleId)
    return this.request(`/inventory?${params.toString()}`)
  }

  async getInventoryItem(id: string): Promise<unknown> {
    return this.request(`/inventory/${id}`)
  }

  async findProductItemByIMEI(
    imei: string,
    excludeUnavailable = false,
    includeInRepair = false,
    saleId?: string | null
  ): Promise<InventoryItem | null> {
    const params = new URLSearchParams({
      imei,
      excludeUnavailable: String(excludeUnavailable),
      includeInRepair: String(includeInRepair),
    })
    if (saleId) params.set('saleId', saleId)
    return this.request(`/inventory?${params.toString()}`)
  }

  async createInventoryBatch(
    data: CreateInventoryBatchRequest
  ): Promise<InventoryItem> {
    return this.request('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async createBatchOrItems(data: CreateBatchOrItemsRequest) {
    // Route to specific endpoints based on mode/itemType
    if (data.mode === 'batch' && data.itemType === 'device') {
      return this.request('/inventory/device/batch', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    }

    if (data.mode === 'single' && data.itemType === 'device') {
      return this.request('/inventory/device/single', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    }

    if (data.mode === 'single' && data.itemType === 'accessory') {
      return this.request('/inventory/accessory/single', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    }

    throw new Error('Invalid payload for createBatchOrItems')
  }

  async updateInventoryItem(
    id: string,
    data: {
      table: 'product_items' | 'accessory_items' | 'used_product_items'
      updates: Record<string, unknown>
    }
  ): Promise<InventoryItem> {
    return this.request(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async softDeleteInventoryItems(
    items: Array<{
      id: string
      table: 'product_items' | 'accessory_items' | 'used_product_items'
    }>
  ): Promise<void> {
    return this.request('/inventory/bulk-soft-delete', {
      method: 'POST',
      body: JSON.stringify(items),
    })
  }

  async deleteInventoryItem(id: string): Promise<void> {
    return this.request(`/inventory/${id}`, {
      method: 'DELETE',
    })
  }

  async getBatchs(): Promise<Batch[]> {
    return this.request('/batchs')
  }
}
