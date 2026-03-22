import { createClient as createSupabaseClient } from '../../utils/supabase/server'
import { ClientInsert, ClientUpdate } from '../types/client'

export const getClients = async () => {
  const supabase = await createSupabaseClient()

  // Get all clients with their total sales and payments
  const { data, error } = await supabase
    .from('clients')
    .select(
      `
      *,
      sales!client_id (
        sale_price,
        payments (
          amount
        )
      )
    `
    )
    .order('customer_name', { ascending: true })

  if (error) return { data, error }

  // Calculate balance for each client
  const clientsWithBalance = data?.map((client) => {
    const totalSales =
      client.sales?.reduce(
        (sum: number, sale: any) => sum + Number(sale.sale_price),
        0
      ) || 0
    const totalPayments =
      client.sales?.reduce((sum: number, sale: any) => {
        const salePayments =
          sale.payments?.reduce(
            (paySum: number, payment: any) => paySum + Number(payment.amount),
            0
          ) || 0
        return sum + salePayments
      }, 0) || 0

    const balance = totalSales - totalPayments

    // Remove the sales data from the return object to keep it clean
    const { sales, ...clientData } = client

    return {
      ...clientData,
      balance,
      total_sales: totalSales,
      total_payments: totalPayments,
    }
  })

  return { data: clientsWithBalance, error: null }
}

export const getClientById = async (id: string) => {
  const supabase = await createSupabaseClient()
  const { data, error } = await supabase
    .from('clients')
    .select()
    .eq('id', id)
    .maybeSingle()

  return { data, error }
}

export const getClientBalanceDetails = async (id: string) => {
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('clients')
    .select(
      `
      *,
      sales!client_id (
        id,
        customer_name,
        sale_price,
        sale_date,
        status,
        notes,
        payments (
          id,
          amount,
          payment_method,
          currency,
          payment_date,
          payment_notes
        )
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !data) {
    return { data: null, error }
  }

  // Calculate totals
  const totalSales =
    data.sales?.reduce(
      (sum: number, sale: any) => sum + Number(sale.sale_price),
      0
    ) || 0

  const totalPayments =
    data.sales?.reduce((sum: number, sale: any) => {
      const salePayments =
        sale.payments?.reduce(
          (paySum: number, payment: any) => paySum + Number(payment.amount),
          0
        ) || 0
      return sum + salePayments
    }, 0) || 0

  const balance = totalSales - totalPayments

  return {
    data: {
      ...data,
      balance,
      total_sales: totalSales,
      total_payments: totalPayments,
    },
    error: null,
  }
}

export const createClient = async (client: ClientInsert) => {
  const supabase = await createSupabaseClient()
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single()

  return { data, error }
}

export const updateClient = async (id: string, updates: ClientUpdate) => {
  const supabase = await createSupabaseClient()
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle()

  return { data, error }
}

export const deleteClient = async (id: string) => {
  const supabase = await createSupabaseClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)

  return { error }
}
