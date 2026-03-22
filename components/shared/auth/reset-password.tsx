'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/form'
import { useMutation } from '@tanstack/react-query'

const passwordSchema = z
  .string()
  .min(8, 'Al menos 8 caracteres')
  .regex(/(?=.*[A-Z])/, 'Debe incluir una mayúscula')
  .regex(/(?=.*[a-z])/, 'Debe incluir una minúscula')
  .regex(/(?=.*\d)/, 'Debe incluir un número')
  .regex(/(?=.*[^A-Za-z0-9])/, 'Debe incluir un símbolo')

const schema = z
  .object({
    current_password: z.string().optional(),
    new_password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  })

export type ResetPasswordValues = z.infer<typeof schema>

interface ResetPasswordProps {
  requireCurrent?: boolean
  onSuccess?: () => void
}

export default function ResetPassword({
  requireCurrent = false,
  onSuccess,
}: ResetPasswordProps) {
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  })

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async (values: ResetPasswordValues) => {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: requireCurrent
            ? values.current_password
            : undefined,
          new_password: values.new_password,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error || 'No se pudo actualizar la contraseña')
      }
      return json
    },
    onSuccess: () => {
      if (onSuccess) onSuccess()
    },
  })

  const onSubmit = async (values: ResetPasswordValues) => {
    await mutateAsync(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {requireCurrent && (
          <FormField
            control={form.control}
            name="current_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña actual</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    autoComplete="current-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="new_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva contraseña</FormLabel>
              <FormControl>
                <Input {...field} type="password" autoComplete="new-password" />
              </FormControl>
              <p className="text-sm text-gray-500">
                La contraseña debe tener al menos 8 caracteres, una mayúscula,
                una minúscula, un número y un símbolo.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar contraseña</FormLabel>
              <FormControl>
                <Input {...field} type="password" autoComplete="new-password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
            {error instanceof Error
              ? error.message
              : 'No se pudo actualizar la contraseña'}
          </div>
        )}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Actualizando...' : 'Actualizar contraseña'}
        </Button>
      </form>
    </Form>
  )
}
