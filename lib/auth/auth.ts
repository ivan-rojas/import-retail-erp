import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'super admin' | 'admin' | 'seller' | 'inventory' | 'viewer'
  must_reset_password?: boolean
  created_at: string
  updated_at: string
}

// Normalize unknown errors to Error instances
const toError = (error: unknown): Error => {
  if (error instanceof Error) return error
  if (typeof error === 'string') return new Error(error)
  try {
    return new Error(JSON.stringify(error))
  } catch {
    return new Error('Unknown error')
  }
}

// Auth functions

// Public sign-up disabled

export const signIn = async (email: string, password: string) => {
  try {
    const res = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { data: null, error: new Error(json?.error || 'Request failed') }
    }
    return { data: json.data, error: null }
  } catch (e: unknown) {
    return { data: null, error: toError(e) }
  }
}

export const signOut = async () => {
  try {
    const res = await fetch('/api/auth/sign-out', { method: 'POST' })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      return { error: new Error(json?.error || 'Request failed') }
    }
    return { error: null }
  } catch (e: unknown) {
    return { error: toError(e) }
  }
}

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const res = await fetch('/api/auth/me', { method: 'GET' })
    if (!res.ok) return null
    const json = await res.json().catch(() => ({}))
    return json?.user ?? null
  } catch {
    return null
  }
}

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const res = await fetch('/api/auth/profile', { method: 'GET' })
    if (!res.ok) return null
    const json = await res.json().catch(() => ({}))
    return json?.profile ?? null
  } catch (error) {
    console.error('Unexpected error in getUserProfile:', error)
    return null
  }
}

export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
) => {
  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { data: null, error: new Error(json?.error || 'Request failed') }
    }
    return { data: json.profile, error: null }
  } catch (e: unknown) {
    return { data: null, error: toError(e) }
  }
}

// Role checking functions
export const hasRole = (
  profile: UserProfile | null,
  roles: string[]
): boolean => {
  if (!profile) return false
  if (profile.role === 'super admin') return true
  return roles.includes(profile.role)
}

export const isAdmin = (profile: UserProfile | null): boolean => {
  return hasRole(profile, ['admin', 'super admin'])
}

export const canSell = (profile: UserProfile | null): boolean => {
  return hasRole(profile, ['super admin', 'admin', 'seller', 'inventory'])
}

export const canViewSales = (profile: UserProfile | null): boolean => {
  return hasRole(profile, [
    'super admin',
    'admin',
    'seller',
    'inventory',
    'viewer',
  ])
}

export const canViewInventory = (profile: UserProfile | null): boolean => {
  return hasRole(profile, ['super admin', 'admin', 'inventory'])
}
