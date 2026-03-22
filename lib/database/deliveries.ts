import { createClient } from '../../utils/supabase/server'
import { Delivery, DeliveryDTO } from '../types/delivery'
import { RawSaleData } from '../types/sales'
import { convertRawSaleDataToSaleDTO } from '../utils/sales'
import { convertSaleDTOToDeliveryDTO } from '../utils/deliveries'
import { getBaseQuerySales } from './sales'
import { CreateDeliveryData } from '../types/delivery'
import { parseArgentinaTime } from '../utils'

// Create a delivery record
export const createDelivery = async (delivery: CreateDeliveryData) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deliveries')
    .insert(delivery)
    .select()
    .single()

  return { data, error }
}

export const updateDelivery = async (delivery: Delivery) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deliveries')
    .update(delivery)
    .eq('id', delivery.id)
    .select()
    .single()
  return { data, error }
}

// Update delivery status
export const updateDeliveryStatus = async (
  id: string,
  status: 'pending' | 'delivered' | 'cancelled',
  userId: string
) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deliveries')
    .update({
      delivery_status: status,
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

// Get deliveries for a sale or reservation
export const getDeliveries = async (userId?: string) => {
  const supabase = await createClient()

  let query = supabase
    .from('sales')
    .select(getBaseQuerySales())
    .not('deliveries', 'is', null)

  if (userId) {
    query = query.eq('deliveries.delivery_user_id', userId)
  }

  const { data, error } = await query

  if (error) {
    return { data: null, error }
  }

  const saleDTOs = convertRawSaleDataToSaleDTO(data as unknown as RawSaleData[])
  const deliveryDTOs: DeliveryDTO[] = saleDTOs.flatMap((saleDTO) => {
    return convertSaleDTOToDeliveryDTO(saleDTO)
  })

  deliveryDTOs.sort((a, b) => {
    return (
      new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime()
    )
  })

  return { data: deliveryDTOs, error }
}

// Helper to create delivery for immediate sale (default delivery)
export const createDefaultDelivery = async (
  saleId: string,
  userId: string,
  deliveryDate: string = new Date().toISOString().split('T')[0]
) => {
  return createDelivery({
    sale_id: saleId,
    delivery_date: deliveryDate,
    delivery_status: 'delivered', // Immediate delivery
    delivery_user_id: userId,
    created_by: userId,
    updated_by: userId,
    is_default: true,
  })
}

// Helper to create delivery for scheduled delivery
export const createScheduledDelivery = async (
  saleId: string | undefined,
  reservationId: string | undefined,
  deliveryDate: string,
  deliveryNotes: string | undefined,
  userId: string
) => {
  const deliveryDateTime = parseArgentinaTime(deliveryDate)

  const status = deliveryDateTime < new Date() ? 'delivered' : 'pending'
  return createDelivery({
    sale_id: saleId,
    reservation_id: reservationId,
    delivery_date: deliveryDate,
    delivery_notes: deliveryNotes,
    delivery_status: status, // Scheduled delivery
    delivery_user_id: userId,
    created_by: userId,
    updated_by: userId,
    is_default: false,
  })
}

export const updateDeliveryForSale = async (
  deliveryId: string,
  deliveryData: {
    delivery_date?: string
    delivery_notes?: string
  }
) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deliveries')
    .update(deliveryData)
    .eq('id', deliveryId)
    .select()
    .single()
  return { data, error }
}
// Helper function to handle delivery creation
export const handleDeliveryForSale = async (
  saleId: string,
  deliveryData: {
    is_default_delivery: boolean
    delivery_date: string
    delivery_notes?: string
  },
  userId: string
) => {
  try {
    if (deliveryData.is_default_delivery) {
      // Create immediate delivery (delivered status)
      const { error } = await createDefaultDelivery(
        saleId,
        userId,
        deliveryData.delivery_date
      )
      return error
    } else {
      // Create scheduled delivery (pending status)
      const { error } = await createScheduledDelivery(
        saleId,
        undefined, // no reservation_id for sales
        deliveryData.delivery_date,
        deliveryData.delivery_notes,
        userId
      )
      return error
    }
  } catch (error) {
    return error
  }
}
