'use server'

import { createPaymentForSale } from '@/lib/database/payments'

export async function createPaymentAction(
  saleId: string,
  salePrice: number,
  paymentMethod: 'cash' | 'transfer' | 'crypto',
  options: {
    currency?: 'USD' | 'ARS'
    exchange_rate?: number
    payment_date?: string
    payment_notes?: string | null
    surcharge_percentage?: number
    converted_amount?: number
    amount_tendered?: number
    change_amount?: number
    sale_date: string
    base_amount?: number
  }
) {
  if (!saleId || typeof saleId !== 'string') {
    throw new Error('Invalid saleId')
  }
  if (typeof salePrice !== 'number' || salePrice <= 0) {
    throw new Error('Invalid salePrice')
  }
  if (options.exchange_rate !== undefined && options.exchange_rate <= 0) {
    throw new Error('Invalid exchange_rate')
  }
  return createPaymentForSale(saleId, salePrice, paymentMethod, null, options)
}
