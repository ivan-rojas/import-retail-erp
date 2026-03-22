import { z } from 'zod'

export const deliveryFormSchema = z
  .object({
    isDefaultDelivery: z.boolean(),
    deliveryDate: z.string().optional(),
    deliveryTime: z.string().optional(),
    deliveryNotes: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.isDefaultDelivery && !data.deliveryDate?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['deliveryDate'],
        message: 'Seleccione una fecha de entrega.',
      })
    }
  })

export type DeliveryFormData = z.infer<typeof deliveryFormSchema>
