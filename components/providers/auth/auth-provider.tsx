'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/utils/supabase/supabase'
import { getUserProfile, type UserProfile } from '@/lib/auth/auth'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set a shorter timeout for initial session check only
    const loadingTimeout = setTimeout(() => {
      console.warn(
        'AuthProvider: Loading timeout reached (3s), forcing loading to false'
      )
      setLoading(false)
    }, 3000) // Reduced to 3 seconds

    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('AuthProvider: Session error:', sessionError)
        }

        setUser(session?.user ?? null)

        // Always set loading to false after getting session, regardless of profile
        setLoading(false)
        clearTimeout(loadingTimeout)

        // Fetch profile in background, non-blocking
        if (session?.user) {
          // Don't await this - let it run in background
          getUserProfile()
            .then((userProfile) => {
              setProfile(userProfile)
            })
            .catch((error) => {
              console.error('AuthProvider: Error fetching user profile:', error)
              setProfile(null)
            })
        }
      } catch (error) {
        console.error('AuthProvider: Error in getSession:', error)
        setLoading(false)
        clearTimeout(loadingTimeout)
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      try {
        setUser(session?.user ?? null)
        setLoading(false)

        // Fetch profile in background, non-blocking
        if (session?.user) {
          // Don't await this - let it run in background
          getUserProfile()
            .then((userProfile) => {
              setProfile(userProfile)
            })
            .catch((error) => {
              console.error(
                'AuthProvider: Error fetching profile on auth change:',
                error
              )
              setProfile(null)
            })
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.error('AuthProvider: Error in auth state change:', error)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(loadingTimeout)
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = async () => {
    try {
      if (!user) {
        setProfile(null)
        return
      }
      const userProfile = await getUserProfile()
      setProfile(userProfile)
    } catch (error) {
      console.error('AuthProvider: Error refreshing profile:', error)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signOut: handleSignOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
