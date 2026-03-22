'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { clientSchema, type ClientFormData } from '@/lib/schemas/client'
import { useCreateClient, useUpdateClient } from '@/lib/hooks/use-clients'
import type { Client } from '@/lib/types/client'
import { Loader2 } from 'lucide-react'

interface ClientFormProps {
  client?: Client | null
  onSuccess: () => void
  onCancel: () => void
}

export default function ClientForm({
  client,
  onSuccess,
  onCancel,
}: ClientFormProps) {
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      customer_ig: '',
      customer_alias_cbu: '',
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  })

  // Update form when client changes
  useEffect(() => {
    if (client) {
      form.reset({
        customer_name: client.customer_name,
        customer_email: client.customer_email || '',
        customer_phone: client.customer_phone || '',
        customer_ig: client.customer_ig || '',
        customer_alias_cbu: client.customer_alias_cbu || '',
      })
    } else {
      form.reset({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_ig: '',
        customer_alias_cbu: '',
      })
    }
  }, [client, form])

  const onSubmit = async (data: ClientFormData) => {
    try {
      // Transform data to ensure optional fields are null instead of undefined or empty string
      const transformedData: {
        customer_name: string
        customer_ig: string | null
        customer_email: string | null
        customer_phone: string | null
        customer_alias_cbu: string | null
      } = {
        customer_name: data.customer_name,
        customer_ig:
          data.customer_ig && data.customer_ig.trim() !== ''
            ? data.customer_ig
            : null,
        customer_email:
          data.customer_email && data.customer_email.trim() !== ''
            ? data.customer_email
            : null,
        customer_phone:
          data.customer_phone && data.customer_phone.trim() !== ''
            ? data.customer_phone
            : null,
        customer_alias_cbu:
          data.customer_alias_cbu && data.customer_alias_cbu.trim() !== ''
            ? data.customer_alias_cbu
            : null,
      }

      if (client) {
        // Update existing client
        await updateClient.mutateAsync({
          id: client.id,
          data: transformedData,
        })
      } else {
        // Create new client
        await createClient.mutateAsync(transformedData)
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving client:', error)
    }
  }

  const isLoading = createClient.isPending || updateClient.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="customer_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nombre del cliente" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customer_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customer_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="+54 9 11 1234-5678"
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customer_ig"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instagram</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="@usuario"
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customer_alias_cbu"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alias/CBU</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Alias o CBU"
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : client ? (
              'Actualizar'
            ) : (
              'Crear'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}
