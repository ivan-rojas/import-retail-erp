import { z } from 'zod'

export const paymentSchema = z.object({
  baseAmount: z.string(),
  amount: z.string(),
  paymentMethod: z
    .union([z.literal('cash'), z.literal('transfer'), z.literal('crypto')])
    .default('cash'),
  currency: z.union([z.literal('USD'), z.literal('ARS')]).default('USD'),
  exchangeRate: z.string().optional(),
  paymentDate: z.string(),
  notes: z.string().optional(),
  surchargePercentage: z.string().optional(),
  convertedAmount: z.string().optional(),
  amountTendered: z.string().optional(),
  changeAmount: z.string().optional(),
})

export type PaymentFormValues = z.infer<typeof paymentSchema>

export const saleFormSchema = z.object({
  customerName: z.string().min(1, 'Nombre requerido'),
  customerIG: z.string().optional().or(z.literal('')),
  customerPhone: z.string().optional().or(z.literal('')),
  customerEmail: z.email('Email inválido').optional().or(z.literal('')),
  customerAliasCbu: z.string().optional().or(z.literal('')),
  subtotalPrice: z.string(),
  totalPrice: z.string(),
  saleStatus: z.union([z.literal('sold'), z.literal('reserved')]),
  saleDate: z.string(),
  deposit: z.string().optional(),
  payments: z.array(paymentSchema),
  isDefaultDelivery: z.boolean(),
  deliveryDate: z.string(),
  deliveryTime: z.string().optional(),
  deliveryNotes: z.string().optional(),
  clientId: z.string().optional(),
})

export type SaleFormValues = z.infer<typeof saleFormSchema>

export const completeSaleFormSchema = z.object({
  subtotalPrice: z.string(),
  totalPrice: z.string(),
  deposit: z.string(),
  amountToPay: z.string(),
  payments: z.array(paymentSchema).min(1, 'Al menos un pago es requerido'),
})

export type CompleteSaleFormValues = z.infer<typeof completeSaleFormSchema>
