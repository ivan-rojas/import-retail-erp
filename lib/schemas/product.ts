import { z } from 'zod'
import { ITEM_TYPES, STATUSES } from '@/lib/enums'

// Form input schema (what the form fields contain)
export const productFormInputSchema = z
  .object({
    name: z.string().min(1, 'El nombre del producto es requerido'),
    type: z.enum(ITEM_TYPES),
    category_id: z.string().uuid('La categoría es requerida'),
    model: z.string().min(1, 'El modelo es requerido'),
    available_colors: z.string().optional(),
    available_storage: z.string().optional(),
    base_price: z.string().min(1, 'El precio es requerido'),
    wholesale_price: z.string().optional(),
    description: z.string().optional(),
    specifications: z.string().optional(),
    status: z.enum(STATUSES),
  })
  .superRefine((data, ctx) => {
    if (
      data.type === 'product' &&
      (!data.available_colors || data.available_colors.trim().length === 0)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['available_colors'],
        message: 'Al menos un color es requerido',
      })
    }
  })

// Processed schema (what gets sent to the API)
export const productFormSchema = productFormInputSchema.transform((data) => ({
  name: data.name,
  type: data.type,
  category_id: data.category_id,
  model: data.model,
  available_colors: data.available_colors
    ? data.available_colors
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c)
    : [],
  available_storage: data.available_storage
    ? data.available_storage
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s)
    : undefined,
  base_price: parseFloat(data.base_price),
  wholesale_price: data.wholesale_price ? parseFloat(data.wholesale_price) : 0,
  description: data.description ?? '',
  specifications: data.specifications
    ? (() => {
        const specs: Record<string, string> = {}
        data.specifications.split('\n').forEach((line) => {
          const [key, ...valueParts] = line.split(':')
          if (key && valueParts.length > 0) {
            specs[key.trim()] = valueParts.join(':').trim()
          }
        })
        return specs
      })()
    : {},
  status: data.status,
}))

export type ProductFormInputData = z.infer<typeof productFormInputSchema>
export type ProductFormData = z.infer<typeof productFormSchema>
