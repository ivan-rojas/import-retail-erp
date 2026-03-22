import { SaleItem } from './sale-item'

export interface Reservation {
  id: string
  deposit: number
  status: 'pending' | 'confirmed' | 'cancelled'
  sale_reservation_items?: SaleItem[]
}
