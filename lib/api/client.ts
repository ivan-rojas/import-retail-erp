import { supabase } from '@/utils/supabase/supabase'
import type { CreateProductRequest } from '@/lib/types/product'
import type { SaleDTO } from '@/lib/types/sales'
import type {
  CreateBatchOrItemsRequest,
  CreateInventoryBatchRequest,
} from '@/lib/types/inventory'
import { ProductsApi } from './products'
import { InventoryApi } from './inventory'
import { SalesApi } from './sales'
import { StatsApi } from './stats'
import { DeliveriesApi } from './deliveries'
import { ClientsApi } from './clients'
import type { PaymentDTO } from '@/lib/types/payment'
import { CreateDeliveryData } from '../types/delivery'
import type { ClientInsert, ClientUpdate } from '@/lib/types/client'

class ApiClient {
  private products: ProductsApi
  private inventory: InventoryApi
  private sales: SalesApi
  private stats: StatsApi
  private deliveries: DeliveriesApi
  private clients: ClientsApi

  constructor() {
    this.products = new ProductsApi(this.request.bind(this))
    this.inventory = new InventoryApi(this.request.bind(this))
    this.sales = new SalesApi(this.request.bind(this))
    this.stats = new StatsApi(this.request.bind(this))
    this.deliveries = new DeliveriesApi(this.request.bind(this))
    this.clients = new ClientsApi(this.request.bind(this))
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getAuthHeaders()

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))

      // Handle specific auth errors
      if (response.status === 401) {
        console.error('Authentication error (401):', error)
        // Only redirect on 401 (unauthorized), not 403 (forbidden)
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      } else if (response.status === 403) {
        console.error('Permission error (403):', error)
        // Don't redirect on 403 - user is authenticated but lacks permission
      }

      throw new Error(
        error.error || `HTTP ${response.status}: ${response.statusText}`
      )
    }

    return response.json()
  }

  // Inventory methods
  async getInventory(
    excludeUnavailable = false,
    includeInRepair = false,
    saleId?: string | null
  ) {
    return this.inventory.getInventory(
      excludeUnavailable,
      includeInRepair,
      saleId
    )
  }

  async getInventoryItem(id: string) {
    return this.inventory.getInventoryItem(id)
  }

  async createInventoryBatch(data: CreateInventoryBatchRequest) {
    return this.inventory.createInventoryBatch(data)
  }

  async createBatchOrItems(data: CreateBatchOrItemsRequest) {
    return this.inventory.createBatchOrItems(data)
  }

  async updateInventoryItem(
    id: string,
    data: {
      table: 'product_items' | 'accessory_items' | 'used_product_items'
      updates: Record<string, unknown>
    }
  ) {
    return this.inventory.updateInventoryItem(id, data)
  }

  async softDeleteInventoryItems(
    items: Array<{
      id: string
      table: 'product_items' | 'accessory_items' | 'used_product_items'
    }>
  ) {
    return this.inventory.softDeleteInventoryItems(items)
  }

  async deleteInventoryItem(id: string) {
    return this.inventory.deleteInventoryItem(id)
  }

  async getBatchs() {
    return this.inventory.getBatchs()
  }

  // Product definitions methods
  async getProducts() {
    return this.products.getProducts()
  }

  async getProductById(id: string) {
    return this.products.getProductById(id)
  }

  async createProduct(data: CreateProductRequest) {
    return this.products.createProduct(data)
  }

  async updateProduct(id: string, data: Partial<CreateProductRequest>) {
    return this.products.updateProduct(id, data)
  }

  async deleteProduct(id: string) {
    return this.products.deleteProduct(id)
  }

  // Sales methods
  async getSales() {
    return this.sales.getSales()
  }

  async getSaleById(id: string) {
    return this.sales.getSaleById(id)
  }

  async createSale(data: SaleDTO) {
    return this.sales.createSale(data)
  }

  async updateSale(id: string, data: SaleDTO) {
    return this.sales.updateSale(id, data)
  }

  async deleteSale(id: string) {
    return this.sales.deleteSale(id)
  }

  async completeSale(
    id: string,
    data: PaymentDTO | PaymentDTO[],
    savePayments: boolean
  ) {
    return this.sales.completeSale(id, data, savePayments)
  }

  async getInventoryItemsForSale() {
    return this.sales.getInventoryItemsForSale()
  }

  // Device IMEIs methods
  async findProductItemByIMEI(
    imei: string,
    excludeUnavailable = false,
    includeInRepair = false,
    saleId?: string | null
  ) {
    return this.inventory.findProductItemByIMEI(
      imei,
      excludeUnavailable,
      includeInRepair,
      saleId
    )
  }

  // Stats methods
  async getStats() {
    return this.stats.getStats()
  }

  async getInventoryStats() {
    return this.stats.getInventoryStats()
  }

  async getSalesStats() {
    return this.stats.getSalesStats()
  }

  async getProfitsStats(fromDate?: Date, toDate?: Date) {
    return this.stats.getProfitsStats(fromDate, toDate)
  }

  // Deliveries methods
  async getDeliveries() {
    return this.deliveries.getDeliveries()
  }

  async updateDeliveryStatus(
    deliveryId: string,
    status: 'delivered' | 'cancelled' | 'pending'
  ) {
    return this.deliveries.updateDeliveryStatus(deliveryId, status)
  }

  async createDelivery(data: CreateDeliveryData) {
    return this.deliveries.createDelivery(data)
  }

  // Clients methods
  async getClients() {
    return this.clients.getClients()
  }

  async getClientById(id: string) {
    return this.clients.getClientById(id)
  }

  async createClient(data: ClientInsert) {
    return this.clients.createClient(data)
  }

  async updateClient(id: string, data: ClientUpdate) {
    return this.clients.updateClient(id, data)
  }

  async deleteClient(id: string) {
    return this.clients.deleteClient(id)
  }

  async getClientBalanceDetails(id: string) {
    return this.clients.getClientBalanceDetails(id)
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
  }) {
    return this.clients.createBatchPayments(data)
  }
}

export const apiClient = new ApiClient()
