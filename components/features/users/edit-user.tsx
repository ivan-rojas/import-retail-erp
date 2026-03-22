import { Button } from '@/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { Edit } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import type { UserProfile } from '@/lib/auth/auth'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateUserSchema } from '@/lib/schemas/user'

interface EditUserProps {
  onUserUpdated: () => void
  userProfile: UserProfile
}

function EditUser({ onUserUpdated, userProfile }: EditUserProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const schema = useMemo(() => updateUserSchema, [])
  type FormValues = z.infer<typeof schema>

  const safeRole: FormValues['role'] = (
    ['admin', 'seller', 'inventory', 'viewer'] as const
  ).includes(userProfile.role as FormValues['role'])
    ? (userProfile.role as FormValues['role'])
    : 'viewer'

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: userProfile.full_name || '',
      role: safeRole,
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  })

  const { mutateAsync: updateUser, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await fetch(`/api/admin/users/${userProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: values.full_name.trim(),
          role: values.role,
        }),
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(json?.error || 'No se pudo actualizar el usuario')
      }
      return json
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onUserUpdated()
      setIsOpen(false)
    },
  })

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    await updateUser(values)
  }
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          setIsOpen(true)
          form.reset({
            full_name: userProfile.full_name || '',
            role: safeRole,
          })
        } else {
          setIsOpen(false)
          form.reset({ full_name: '', role: 'viewer' })
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField<FormValues>
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nuevo nombre" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField<FormValues>
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                        <SelectItem value="inventory">Inventario</SelectItem>
                        <SelectItem value="seller">Vendedor</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? 'Actualizando...' : 'Actualizar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="sm:w-auto"
              >
                Cancelar
              </Button>
            </div>
            </form>
          </Form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export default EditUser
