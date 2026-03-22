'use client'

import React from 'react'
import ResetPassword from '@/components/shared/auth/reset-password'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/auth'

export default function ResetPasswordPage() {
  const router = useRouter()

  const handleSuccess = async () => {
    // Sign out so the user re-authenticates with the new password
    await signOut()
    router.push('/login')
  }

  return (
    <div className="container mx-auto p-6 max-w-md min-h-screen flex items-center justify-center">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Restablecer contraseña</h1>
          <p className="text-muted-foreground">
            Debes actualizar tu contraseña para continuar usando la aplicación.
          </p>
        </div>
        <ResetPassword requireCurrent={false} onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
