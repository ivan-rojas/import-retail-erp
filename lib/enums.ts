export type UserRole =
  | 'super admin'
  | 'admin'
  | 'seller'
  | 'inventory'
  | 'viewer'
export const USER_ROLES: readonly UserRole[] = [
  'super admin',
  'admin',
  'seller',
  'inventory',
  'viewer',
] as const

export type Status = 'active' | 'inactive' | 'deleted'
export const STATUSES: readonly Status[] = [
  'active',
  'inactive',
  'deleted',
] as const

export type ItemType = 'product' | 'accessory'
export const ITEM_TYPES: readonly ItemType[] = ['product', 'accessory'] as const

export type ItemStatus =
  | 'available'
  | 'sold'
  | 'reserved'
  | 'lost'
  | 'deleted'
  | 'in-repair'
  | 'spare'
export const ITEM_STATUSES: readonly ItemStatus[] = [
  'available',
  'sold',
  'reserved',
  'lost',
  'deleted',
  'in-repair',
  'spare',
] as const

export type SaleStatus = 'sold' | 'deleted'
export const SALE_STATUSES: readonly SaleStatus[] = ['sold', 'deleted'] as const

export type ItemCondition = 'new' | 'used' | 'refurbished'
export const ITEM_CONDITIONS: readonly ItemCondition[] = [
  'new',
  'used',
  'refurbished',
] as const

// Subset used by device item forms (UI supports only new/used)
export const DEVICE_ITEM_CONDITIONS: readonly ['new', 'used'] = [
  'new',
  'used',
] as const

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled'
export const RESERVATION_STATUSES: readonly ReservationStatus[] = [
  'pending',
  'confirmed',
  'cancelled',
] as const

export type Currency = 'USD' | 'ARS'
export const CURRENCIES: readonly Currency[] = ['USD', 'ARS'] as const

export type PaymentMethod = 'cash' | 'transfer' | 'crypto'
export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  'cash',
  'transfer',
  'crypto',
] as const

export type DeliveryStatus = 'pending' | 'delivered' | 'cancelled'
export const DELIVERY_STATUSES: readonly DeliveryStatus[] = [
  'pending',
  'delivered',
  'cancelled',
] as const
