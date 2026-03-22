import { SaleDTO } from './sales'

export interface Delivery {
  id: string
  delivery_date: string
  delivery_notes?: string | null
  delivery_status: 'pending' | 'delivered' | 'cancelled'
  delivery_user_id: string
  is_default: boolean
}

export interface DeliveryDTO extends Delivery {
  sale_id?: string | null
  sale?: SaleDTO | null
}

export interface CreateDeliveryData {
  sale_id?: string
  reservation_id?: string
  delivery_date: string
  delivery_notes?: string
  delivery_status: 'pending' | 'delivered' | 'cancelled'
  delivery_user_id: string
  is_default: boolean
  created_by: string
  updated_by: string
}
