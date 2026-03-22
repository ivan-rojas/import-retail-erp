import type {
  Client,
  ClientInsert,
  ClientUpdate,
  ClientBalanceDetails,
} from '@/lib/types/client'

export class ClientsApi {
  constructor(
    private request: <T>(endpoint: string, options?: RequestInit) => Promise<T>
  ) {}

  async getClients(): Promise<Client[]> {
    return this.request('/clients')
  }

  async getClientById(id: string): Promise<Client> {
    return this.request(`/clients/${id}`)
  }

  async createClient(data: ClientInsert): Promise<Client> {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateClient(id: string, data: ClientUpdate): Promise<Client> {
    return this.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteClient(id: string): Promise<void> {
    return this.request(`/clients/${id}`, {
      method: 'DELETE',
    })
  }

  async getClientBalanceDetails(id: string): Promise<ClientBalanceDetails> {
    return this.request(`/clients/${id}/balance`)
  }

  async createBatchPayments(data: {
    saleId: string
    payments: Array<{
      amount: number
      paymentMethod: 'cash' | 'transfer' | 'crypto'
      currency?: 'USD' | 'ARS'
      exchange_rate?: number
      payment_date?: string
      payment_notes?: string | null
      surcharge_percentage?: number
      converted_amount?: number
      amount_tendered?: number
      change_amount?: number
      base_amount?: number
    }>
    saleDate: string
  }): Promise<{ data: unknown[]; success: boolean }> {
    return this.request(`/clients/${data.saleId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}
