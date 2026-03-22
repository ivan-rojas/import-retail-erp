import { createClient } from '../../utils/supabase/server'

// Basic CRUD operations for reservations

export const getReservations = async () => {
  const supabase = await createClient()
  const query = supabase
    .from('reservations')
    .select(`*`)
    .order('created_at', { ascending: false })

  const { data, error } = await query
  return { data, error }
}

export const getReservationById = async (id: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reservations')
    .select(`*`)
    .eq('id', id)
    .single()

  return { data, error }
}

export const getReservationBySaleId = async (saleId: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reservations')
    .select(`*`)
    .eq('sale_id', saleId)
    .single()
  return { data, error }
}

export const createReservation = async (
  reservation: Record<string, unknown>
) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reservations')
    .insert(reservation)
    .select()
    .single()

  return { data, error }
}

export const updateReservationStatus = async (
  id: string,
  status: 'pending' | 'confirmed' | 'cancelled'
) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export const updateReservation = async (
  id: string,
  updates: Record<string, unknown>
) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reservations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}
