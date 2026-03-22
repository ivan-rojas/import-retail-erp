import { z } from 'zod'
import { DEVICE_ITEM_CONDITIONS } from '../enums'

export const accessoryItemFormSchema = z.object({
  mode: z.literal('single'),
  itemType: z.literal('accessory'),
  product_id: z.string().min(1, 'Selecciona un producto'),
  search: z.string().optional(),
  batch_id: z.string().min(1, 'Selecciona un lote'),
  batchSearch: z.string().optional(),
  name: z.string().min(1, 'Requerido'),
  color: z.string().optional(),
  cost: z.number().optional(),
  price: z.number().optional(),
  wholesale_price: z.number().optional(),
  quantity: z.number().int().min(0, 'Cantidad inválida'),
  notes: z.string().optional(),
})

export type AccessoryItemFormValues = z.infer<typeof accessoryItemFormSchema>

export const deviceBatchFormSchema = z.object({
  mode: z.literal('batch'),
  itemType: z.literal('device'),
  batchName: z.string().min(1, 'Requerido'),
  batchDate: z.string().min(1, 'Requerido'),
  product_id: z.string().min(1, 'Selecciona un producto'),
  search: z.string().optional(),
  name: z.string().min(1, 'Requerido'),
  color: z.string().min(1, 'Requerido'),
  storage: z.string().optional(),
  cost: z.number().positive('Costo inválido'),
  price: z.number().optional(),
  wholesale_price: z.number().optional(),
  imeisList: z
    .array(
      z.string().regex(/^\d{14,16}$/, 'IMEI debe tener entre 14 y 16 dígitos')
    )
    .min(1, 'Al menos un IMEI es requerido'),
  condition: z.enum(['new', 'used']),
  used_battery_health: z.number().int().min(0).max(100).optional(),
  used_issues: z.string().optional(),
  used_fixes: z.string().optional(),
})

export type DeviceBatchFormValues = z.infer<typeof deviceBatchFormSchema>

export const deviceItemFormSchema = z.object({
  mode: z.literal('single'),
  itemType: z.literal('device'),
  product_id: z.string().min(1, 'Selecciona un producto'),
  search: z.string().optional(),
  batch_id: z.string().min(1, 'Selecciona un lote'),
  batchSearch: z.string().optional(),
  name: z.string().min(1, 'Requerido'),
  color: z.string().min(1, 'Requerido'),
  storage: z.string().optional(),
  cost: z.number().positive('Costo inválido'),
  price: z.number().optional(),
  wholesale_price: z.number().optional(),
  is_on_sale: z.boolean().optional(),
  imei: z
    .string()
    .min(1, 'IMEI requerido')
    .regex(/^\d{14,16}$/, 'IMEI debe tener entre 14 y 16 dígitos'),
  condition: z.enum(DEVICE_ITEM_CONDITIONS),
  used_battery_health: z.number().int().min(0).max(100).optional(),
  used_issues: z.string().optional(),
  used_fixes: z.string().optional(),
  notes: z.string().optional(),
})

export type DeviceItemFormValues = z.infer<typeof deviceItemFormSchema>
