'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
//
import { isAdmin, getUserProfile } from '@/lib/auth/auth'
import { useAuth } from '@/components/providers/auth/auth-provider'
import type { UserProfile } from '@/lib/auth/auth'
import UsersTable from '../../../components/features/users/users-table'

export default function AdminUsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      const userProfile = await getUserProfile()
      setProfile(userProfile)

      if (!isAdmin(userProfile)) {
        router.push('/dashboard')
        return
      }
    }

    checkAccess()
  }, [user, router])

  if (!user || !profile || !isAdmin(profile)) {
    return null
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona usuarios del sistema</p>
        </div>

        <UsersTable />
      </div>
    </div>
  )
}
