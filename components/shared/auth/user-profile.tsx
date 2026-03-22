'use client'

import { LogOut, User, Settings, KeyRound } from 'lucide-react'
import { Button } from '@/ui/button'
import { useAuth } from '@/components/providers/auth/auth-provider'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog'
import { Input } from '@/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/form'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const schema = z.object({
  full_name: z.string().min(1, 'El nombre es requerido').max(120),
})

type FormValues = z.infer<typeof schema>

export default function UserProfile() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: profile?.full_name || '' },
  })

  const {
    mutateAsync: updateProfile,
    isPending,
    error,
  } = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: values.full_name }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok)
        throw new Error(json?.error || 'No se pudo actualizar el perfil')
      return json
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      await refreshProfile()
      setOpen(false)
    },
  })

  return (
    <div className="flex items-center gap-3">
      {/* Role badge on the left */}

      {/* User icon with dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-full p-0"
          >
            <div className="border p-1.5 rounded-full">
              <User className="h-4 w-4" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none flex items-center gap-2">
                {profile?.full_name || user?.email}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Cuenta</span>
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <User className="mr-2 h-6 w-6" />
                  Cuenta
                </DialogTitle>
              </DialogHeader>
              <DialogBody>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(async (values) => {
                      await updateProfile(values)
                    })}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre completo</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {error && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                        {error instanceof Error
                          ? error.message
                          : 'No se pudo actualizar el perfil'}
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full sm:flex-1"
                      >
                        {isPending ? 'Guardando...' : 'Guardar cambios'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/reset-password')}
                        className="w-full sm:w-auto"
                      >
                        <KeyRound className="h-4 w-4 mr-2" />
                        Resetear contraseña
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogBody>
            </DialogContent>
          </Dialog>
          <DropdownMenuItem
            onClick={async () => {
              await signOut()
              router.replace('/login')
            }}
          >
            <LogOut className="mr-2 h-4 w-4 text-red-500" />
            <span className="text-red-500">Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
