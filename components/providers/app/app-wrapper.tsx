'use client'

import { useAuth } from '../auth/auth-provider'
import { AppSidebar } from '../../shared/sidebar/app-sidebar'
import { SidebarTrigger, SidebarProvider, SidebarInset } from '@/ui/sidebar'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import UserProfile from '@/components/shared/auth/user-profile'
import { ThemeToggle } from '@/components/shared/theme/theme-toggle'

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()
  const [isClient, setIsClient] = useState(false)

  // Prevent hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Show loading spinner during hydration and auth loading
  if (!isClient || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-y-auto">
        <div className="w-full flex justify-between items-center p-2">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
