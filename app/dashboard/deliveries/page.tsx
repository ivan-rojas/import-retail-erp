'use client'

import { useState, useEffect } from 'react'
import DeliveryCalendar from '@/components/features/deliveries/views/delivery-calendar'
import { canViewSales, getUserProfile, type UserProfile } from '@/lib/auth/auth'
import { useAuth } from '@/components/providers/auth/auth-provider'
import { useRouter } from 'next/navigation'

function DeliveriesPage() {
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

      if (!canViewSales(userProfile)) {
        router.push('/dashboard')
        return
      }
    }

    checkAccess()
  }, [user, router])

  if (!user || !profile || !canViewSales(profile)) {
    return null
  }

  return (
    <div className="calc-container">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-4">
        <h1 className="text-2xl font-bold text-foreground">Entregas</h1>
      </div>
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-8">
        <DeliveryCalendar />
      </div>
    </div>
  )
}

export default DeliveriesPage
