import { createClient } from '../../utils/supabase/server'
import { getCurrentUserServer } from '@/lib/auth/auth-server'

type PaymentInsertData = {
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
  reservation_id?: string | null
  sale_id: string
  created_by: string
  updated_by: string
}

export const createPayment = async (paymentData: PaymentInsertData) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .insert(paymentData)
    .select()
    .single()

  return { data, error }
}

export const createPaymentForSale = async (
  saleId: string,
  salePrice: number | string,
  paymentMethod: 'cash' | 'transfer' | 'crypto',
  sellerId: string | null,
  options: {
    currency?: 'USD' | 'ARS'
    exchange_rate?: number | string
    payment_date?: string
    payment_notes?: string | null
    surcharge_percentage?: number
    converted_amount?: number
    amount_tendered?: number
    change_amount?: number
    sale_date: string
    base_amount?: number
  }
) => {
  // Get current user if sellerId is not provided
  let userId = sellerId
  if (!userId) {
    const currentUser = await getCurrentUserServer()
    if (!currentUser) {
      return { data: null, error: 'Usuario no autenticado' }
    }
    userId = currentUser.id
  }

  const currency: 'USD' | 'ARS' = options.currency || 'USD'
  const exchangeRateRaw =
    options.exchange_rate ?? (currency === 'USD' ? 1 : undefined)
  const usdExchangeRate =
    currency === 'USD'
      ? 1
      : Number.parseFloat(String(exchangeRateRaw ?? 1)) || 1

  const salePriceNumber =
    typeof salePrice === 'number'
      ? salePrice
      : parseFloat(String(salePrice ?? 0))

  const paymentInsert: PaymentInsertData = {
    base_amount: options.base_amount ?? salePriceNumber,
    amount: salePriceNumber,
    payment_method: paymentMethod,
    currency,
    usd_exchange_rate: usdExchangeRate,
    payment_date: options.payment_date || options.sale_date,
    payment_notes: options.payment_notes ?? null,
    surcharge_percentage: options.surcharge_percentage ?? undefined,
    converted_amount: options.converted_amount ?? undefined,
    amount_tendered: options.amount_tendered ?? undefined,
    change_amount: options.change_amount ?? undefined,
    reservation_id: null,
    sale_id: saleId,
    created_by: userId,
    updated_by: userId,
  }

  return createPayment(paymentInsert)
}

export const updatePayment = async (
  paymentId: string,
  paymentData: PaymentInsertData
) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .update(paymentData)
    .eq('id', paymentId)
    .select()
    .single()
  return { data, error }
}

export const getPaymentsForSale = async (saleId: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('sale_id', saleId)
  return { data, error }
}

export const deletePayment = async (paymentId: string) => {
  const supabase = await createClient()
  const { error } = await supabase.from('payments').delete().eq('id', paymentId)
  return { error }
}

export const deletePayments = async (paymentIds: string[]) => {
  if (paymentIds.length === 0) {
    return { error: null }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('payments')
    .delete()
    .in('id', paymentIds)
  return { error }
}

export const createBatchPaymentsForSale = async (
  saleId: string,
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
  }>,
  saleDate: string,
  sellerId: string | null = null
) => {
  // Get current user if sellerId is not provided
  let userId = sellerId
  if (!userId) {
    const currentUser = await getCurrentUserServer()
    if (!currentUser) {
      return { data: null, error: 'Usuario no autenticado' }
    }
    userId = currentUser.id
  }

  // Prepare all payment insert data
  const paymentInserts: PaymentInsertData[] = payments.map((payment) => {
    const currency: 'USD' | 'ARS' = payment.currency || 'USD'
    const exchangeRateRaw =
      payment.exchange_rate ?? (currency === 'USD' ? 1 : undefined)
    const usdExchangeRate =
      currency === 'USD'
        ? 1
        : Number.parseFloat(String(exchangeRateRaw ?? 1)) || 1

    return {
      base_amount: payment.base_amount ?? payment.amount,
      amount: payment.amount,
      payment_method: payment.paymentMethod,
      currency,
      usd_exchange_rate: usdExchangeRate,
      payment_date: payment.payment_date || saleDate,
      payment_notes: payment.payment_notes ?? null,
      surcharge_percentage: payment.surcharge_percentage ?? undefined,
      converted_amount: payment.converted_amount ?? undefined,
      amount_tendered: payment.amount_tendered ?? undefined,
      change_amount: payment.change_amount ?? undefined,
      reservation_id: null,
      sale_id: saleId,
      created_by: userId,
      updated_by: userId,
    }
  })

  // Insert all payments in a single atomic operation
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .insert(paymentInserts)
    .select()

  return { data, error }
}
