import { z } from 'zod'

export const clientSchema = z.object({
  customer_name: z.string().min(1, 'Nombre del cliente es requerido'),
  customer_ig: z.string().optional().nullable().or(z.literal('')),
  customer_email: z
    .email('Email inválido')
    .optional()
    .nullable()
    .or(z.literal('')),
  customer_phone: z.string().optional().nullable(),
  customer_alias_cbu: z.string().optional().nullable(),
})

export type ClientFormData = z.infer<typeof clientSchema>
