export interface Payment {
  id: string
  base_amount: number
  amount: number
  payment_method: 'cash' | 'transfer' | 'crypto'
  currency: 'USD' | 'ARS'
  usd_exchange_rate: number
  payment_date: string
  payment_notes?: string | null
  surcharge_percentage?: number
  converted_amount?: number
  amount_tendered?: number
  change_amount?: number
}

export type PaymentDTO = Omit<Payment, 'id'>
