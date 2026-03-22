import { createClient } from '../../utils/supabase/server'
import { Database } from '../../utils/supabase/supabase'

export const updateProfile = async (
  id: string | undefined,
  updates: Database['public']['Tables']['profiles']['Update']
) => {
  if (!id) {
    return { data: null, error: 'ID is required' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}
