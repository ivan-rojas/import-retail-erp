import type { CreateDeliveryData, DeliveryDTO } from '@/lib/types/delivery'

export class DeliveriesApi {
  constructor(
    private request: <T>(endpoint: string, options?: RequestInit) => Promise<T>
  ) {}

  async getDeliveries(): Promise<DeliveryDTO[]> {
    return this.request('/deliveries')
  }

  async updateDeliveryStatus(
    deliveryId: string,
    status: 'delivered' | 'cancelled' | 'pending'
  ) {
    return this.request(`/deliveries/${deliveryId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  async createDelivery(data: CreateDeliveryData) {
    return this.request('/deliveries', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}
