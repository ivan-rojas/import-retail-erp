import { createClient } from '@/utils/supabase/client'

export const supabase = createClient()

// Types for our database
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'super admin' | 'admin' | 'seller' | 'inventory' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'super admin' | 'admin' | 'seller' | 'inventory' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'super admin' | 'admin' | 'seller' | 'inventory' | 'viewer'
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          type: 'product' | 'accessory'
          category: string
          model: string
          available_colors: string[]
          available_storage: string[] | null
          base_price: number
          description: string
          specifications: Record<string, string>
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          type: 'product' | 'accessory'
          category: string
          model: string
          available_colors: string[]
          available_storage?: string[] | null
          base_price: number
          description: string
          specifications?: Record<string, string>
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'product' | 'accessory'
          category?: string
          model?: string
          available_colors?: string[]
          available_storage?: string[] | null
          base_price?: number
          description?: string
          specifications?: Record<string, string>
          is_active?: boolean
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          product_item_id: string
          name: string
          color: string
          storage: string | null
          quantity: number
          status: 'available' | 'sold' | 'reserved' | 'deleted'
          price: number
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          product_item_id: string
          name: string
          color: string
          storage?: string | null
          quantity: number
          status?: 'available' | 'sold' | 'reserved' | 'deleted'
          price: number
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          quantity?: number
          status?: 'available' | 'sold' | 'reserved' | 'deleted'
          price?: number
          updated_at?: string
        }
      }
      device_imeis: {
        Row: {
          id: string
          product_item_id: string
          imei: string
          status: 'available' | 'sold' | 'reserved'
          sale_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_item_id: string
          imei: string
          status?: 'available' | 'sold' | 'reserved'
          sale_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'available' | 'sold' | 'reserved'
          sale_id?: string | null
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          product_id: string
          product_name: string
          product_model: string
          imei: string | null
          customer_name: string
          customer_phone: string
          customer_email: string | null
          sale_price: number
          status: 'sold' | 'reserved'
          payment_method: string
          sale_date: string
          notes: string | null
          seller_id: string
          seller_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          product_name: string
          product_model: string
          imei?: string | null
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          sale_price: number
          status: 'sold' | 'reserved'
          payment_method: string
          sale_date: string
          notes?: string | null
          seller_id: string
          seller_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'sold' | 'reserved'
          payment_method?: string
          notes?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'super admin' | 'admin' | 'seller' | 'inventory' | 'viewer'
      item_type: 'product' | 'accessory'
      stock_status: 'in-stock' | 'low-stock' | 'out-of-stock'
      device_status: 'available' | 'sold' | 'reserved'
      sale_status: 'sold' | 'deleted'
      status: 'active' | 'inactive' | 'deleted'
      item_status: 'available' | 'sold' | 'reserved' | 'deleted'
      item_condition: 'new' | 'used' | 'refurbished'
      reservation_status: 'pending' | 'confirmed' | 'cancelled'
      currency: 'USD' | 'ARS'
      payment_method: 'cash' | 'transfer' | 'crypto'
      delivery_status: 'pending' | 'delivered' | 'cancelled'
    }
  }
}
