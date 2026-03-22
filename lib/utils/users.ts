import { UserProfile } from '../auth/auth'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export const getUserProfiles = (
  users: SupabaseUser[],
  profiles: Record<string, UserProfile>
) => {
  const mapped = (users || []).map((u: SupabaseUser) => {
    const profile = profiles?.[u.id] as Partial<UserProfile> | undefined
    return {
      id: u.id,
      email: u.email || profile?.email || '',
      full_name:
        profile?.full_name ??
        u.user_metadata?.full_name ??
        u.user_metadata?.name ??
        null,
      role: (profile?.role as UserProfile['role']) || 'viewer',
      created_at: profile?.created_at || u.created_at,
      updated_at: profile?.updated_at || u.created_at,
    } as UserProfile
  })
  return mapped
}
