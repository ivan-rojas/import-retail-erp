import { createClient } from '@/utils/supabase/server'
import type {
  TechnicianInsert,
  TechnicianUpdate,
} from '@/lib/types/technician'

export const getTechnicians = async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .order('name', { ascending: true })
  return { data, error }
}

export const getTechnicianById = async (id: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return { data, error }
}

export const createTechnician = async (payload: TechnicianInsert) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('technicians')
    .insert({
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
    })
    .select('*')
    .single()
  return { data, error }
}

export const updateTechnician = async (
  id: string,
  payload: TechnicianUpdate
) => {
  const supabase = await createClient()
  const updates: Record<string, unknown> = {}
  if (typeof payload.name === 'string') updates.name = payload.name.trim()
  if (typeof payload.description === 'string') {
    updates.description = payload.description.trim() || null
  } else if (payload.description === null) {
    updates.description = null
  }

  const { data, error } = await supabase
    .from('technicians')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle()
  return { data, error }
}

export const deleteTechnician = async (id: string) => {
  const supabase = await createClient()
  const { error } = await supabase.from('technicians').delete().eq('id', id)
  return { error }
}

