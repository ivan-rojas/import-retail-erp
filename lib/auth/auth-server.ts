import { createClient } from '@/utils/supabase/server'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from './auth'

export const getCurrentUserServer = async (): Promise<User | null> => {
  const serverClient = await createClient()
  const {
    data: { user },
  } = await serverClient.auth.getUser()
  return user
}

export const getUserProfileServer = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    const serverClient = await createClient()

    // Use server client instead of browser client
    const { data, error } = await serverClient
      .from('profiles')
      .select('id, email, full_name, role, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user profile (server):', error)
      return null
    }

    // maybeSingle returns null if no row found, which is fine
    if (!data) {
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error in getUserProfileServer:', error)
    return null
  }
}

// Server-side role checking functions
export const hasRoleServer = (
  profile: UserProfile | null,
  roles: string[]
): boolean => {
  if (!profile) return false
  return roles.includes(profile.role)
}

export const isAdminServer = (profile: UserProfile | null): boolean => {
  return hasRoleServer(profile, ['admin', 'super admin'])
}

export const canSellServer = (profile: UserProfile | null): boolean => {
  return hasRoleServer(profile, ['admin', 'super admin', 'seller', 'inventory'])
}

export const canViewSalesServer = (profile: UserProfile | null): boolean => {
  return hasRoleServer(profile, [
    'admin',
    'super admin',
    'seller',
    'inventory',
    'viewer',
  ])
}

export const canManageInventoryServer = (
  profile: UserProfile | null
): boolean => {
  return hasRoleServer(profile, ['admin', 'super admin', 'inventory'])
}

// Convenience helpers to DRY server-side checks
export const getServerAuth = async (): Promise<{
  user: User | null
  profile: UserProfile | null
}> => {
  const user = await getCurrentUserServer()
  const profile = user ? await getUserProfileServer(user.id) : null
  return { user, profile }
}

export const requireUser = async (): Promise<User> => {
  const user = await getCurrentUserServer()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export const requireAdmin = async (): Promise<{
  user: User
  profile: UserProfile
}> => {
  const user = await requireUser()
  const profile = await getUserProfileServer(user.id)
  if (!profile || !isAdminServer(profile)) {
    throw new Error('Forbidden')
  }
  return { user, profile }
}
