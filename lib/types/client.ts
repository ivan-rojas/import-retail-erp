export type Client = {
  id: string
  customer_name: string
  customer_ig: string | null
  customer_email: string | null
  customer_phone: string | null
  customer_alias_cbu: string | null
  balance: number
  total_sales: number
  total_payments: number
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string | null
}

export type ClientInsert = Omit<
  Client,
  | 'id'
  | 'balance'
  | 'total_sales'
  | 'total_payments'
  | 'created_at'
  | 'updated_at'
  | 'created_by'
  | 'updated_by'
>

export type ClientUpdate = Partial<ClientInsert>

export type ClientSaleDetail = {
  id: string
  customer_name: string
  sale_price: number
  sale_date: string
  status: 'sold' | 'reserved' | 'cancelled' | 'deleted'
  notes: string | null
  payments: ClientPaymentDetail[]
}

export type ClientPaymentDetail = {
  id: string
  amount: number
  payment_method: 'cash' | 'transfer' | 'crypto'
  currency: string
  payment_date: string
  payment_notes: string | null
}

export type ClientBalanceDetails = Client & {
  sales: ClientSaleDetail[]
}
