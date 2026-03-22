import { createClient } from '../../utils/supabase/server'
import type { SaleLineType } from '@/lib/types/sale-item'

export type SaleItemInsertData = {
  item_name: string
  item_model: string
  item_price: number
  item_quantity: number
  item_notes?: string | null
  product_item_id?: string | null
  accessory_item_id?: string | null
  sale_line_type?: SaleLineType | null
  item_cost?: number | null
  linked_product_item_id?: string | null
  reservation_id?: string | null
  sale_id: string
  created_by: string
  updated_by: string
}

export const createSaleItem = async (itemData: SaleItemInsertData) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sale_reservation_items')
    .insert(itemData)
    .select()
    .single()

  return { data, error }
}

export const updateSaleItem = async (
  id: string,
  itemData: SaleItemInsertData
) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sale_reservation_items')
    .update(itemData)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export const deleteSaleItem = async (id: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sale_reservation_items')
    .delete()
    .eq('id', id)
  return { data, error }
}

export const createSaleItemForSale = async (
  saleId: string,
  sellerId: string,
  saleData: {
    product_item_id: string
    product_name: string
    product_model: string
    sale_price: number | string
    type?: 'product' | 'accessory'
    item_quantity?: number
    imei?: string
    notes?: string
  }
) => {
  const itemQuantity = Number(saleData.item_quantity ?? 1)
  const isDevice = saleData.type === 'product' || Boolean(saleData.imei)
  const isAccessory = saleData.type === 'accessory'

  const itemInsert: SaleItemInsertData = {
    item_name: saleData.product_name,
    item_model: saleData.product_model,
    item_price:
      typeof saleData.sale_price === 'number'
        ? saleData.sale_price
        : parseFloat(String(saleData.sale_price ?? 0)),
    item_quantity: isAccessory ? itemQuantity : 1,
    item_notes: saleData.notes ?? null,
    product_item_id: isDevice ? saleData.product_item_id : null,
    accessory_item_id: isAccessory ? saleData.product_item_id : null,
    sale_line_type: isDevice ? 'device' : 'accessory',
    reservation_id: null,
    sale_id: saleId,
    created_by: sellerId,
    updated_by: sellerId,
  }

  return createSaleItem(itemInsert)
}

/** Create a service-type sale line (no inventory impact). */
export const createSaleItemForService = async (
  saleId: string,
  sellerId: string,
  serviceData: {
    item_name: string
    item_model: string
    item_price: number | string
    item_quantity?: number
    item_cost: number | string
    item_notes?: string | null
    linked_product_item_id?: string | null
  }
) => {
  const itemInsert: SaleItemInsertData = {
    item_name: serviceData.item_name,
    item_model: serviceData.item_model,
    item_price:
      typeof serviceData.item_price === 'number'
        ? serviceData.item_price
        : parseFloat(String(serviceData.item_price ?? 0)),
    item_quantity: Number(serviceData.item_quantity ?? 1),
    item_notes: serviceData.item_notes ?? null,
    product_item_id: null,
    accessory_item_id: null,
    sale_line_type: 'service',
    item_cost:
      typeof serviceData.item_cost === 'number'
        ? serviceData.item_cost
        : parseFloat(String(serviceData.item_cost ?? 0)),
    linked_product_item_id: serviceData.linked_product_item_id ?? null,
    reservation_id: null,
    sale_id: saleId,
    created_by: sellerId,
    updated_by: sellerId,
  }

  return createSaleItem(itemInsert)
}

export const getPreviousSaleItems = async (saleId: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sale_reservation_items')
    .select(
      'id, product_item_id, accessory_item_id, item_quantity, sale_line_type'
    )
    .eq('sale_id', saleId)
  return { data, error }
}
