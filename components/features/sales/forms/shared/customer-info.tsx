'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { User } from 'lucide-react'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/ui/form'
import {
  Control,
  FieldValues,
  Path,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form'
import { DatePicker } from '@/ui/date-picker'
import { parseISO, isValid, format } from 'date-fns'
import ClientsSearch from '@/components/features/clients/clients-search'
import { useClientById } from '@/lib/hooks/use-clients'
import type { Client } from '@/lib/types/client'

export interface CustomerInfoData {
  customerName: string
  customerIG?: string
  customerPhone?: string
  customerEmail?: string
  customerAliasCbu?: string
  saleDate?: string
  clientId?: string
}

interface CustomerInfoProps<T extends FieldValues> {
  control: Control<T>
  setValue: UseFormSetValue<T>
  watch: UseFormWatch<T>
  disabled?: boolean
}

export function CustomerInfo<T extends FieldValues>({
  control,
  setValue,
  watch,
  disabled,
}: CustomerInfoProps<T>) {
  const [searchValue, setSearchValue] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [isClientSelected, setIsClientSelected] = useState(false)

  // Watch for clientId in the form
  const formClientId = watch('clientId' as Path<T>) as string | undefined

  // Fetch client data if clientId exists
  const { data: existingClient } = useClientById(formClientId || '')

  // Effect to set client as selected when editing a sale with a clientId
  useEffect(() => {
    if (formClientId && existingClient && !isClientSelected) {
      setSelectedClientId(formClientId)
      setIsClientSelected(true)
      setSearchValue('')
    }
  }, [formClientId, existingClient, isClientSelected])

  const handleClientSelect = (client: Client) => {
    // Set all customer fields from the selected client
    setValue('customerName' as Path<T>, client.customer_name as any)
    setValue('customerEmail' as Path<T>, (client.customer_email || '') as any)
    setValue('customerPhone' as Path<T>, (client.customer_phone || '') as any)
    setValue('customerIG' as Path<T>, (client.customer_ig || '') as any)
    setValue(
      'customerAliasCbu' as Path<T>,
      (client.customer_alias_cbu || '') as any
    )
    setValue('clientId' as Path<T>, client.id as any)

    setSelectedClientId(client.id)
    setSearchValue('')
    setIsClientSelected(true)
  }

  const handleClearClient = () => {
    // Clear all customer fields
    setValue('customerName' as Path<T>, '' as any)
    setValue('customerEmail' as Path<T>, '' as any)
    setValue('customerPhone' as Path<T>, '' as any)
    setValue('customerIG' as Path<T>, '' as any)
    setValue('customerAliasCbu' as Path<T>, '' as any)
    setValue('clientId' as Path<T>, undefined as any)

    setSelectedClientId('')
    setSearchValue('')
    setIsClientSelected(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Información del Cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Client Search Section */}
        <div className="mb-6 p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-foreground">
              Cliente Mayorista (Opcional)
            </div>
          </div>
          <ClientsSearch
            value={selectedClientId}
            searchValue={searchValue}
            onValueChange={setSelectedClientId}
            onSearchChange={setSearchValue}
            onClientSelect={handleClientSelect}
            onClear={handleClearClient}
            placeholder="Buscar cliente mayorista..."
            disabled={disabled}
          />
          {isClientSelected && !disabled && (
            <p className="text-xs text-muted-foreground mt-2">
              Cliente seleccionado. Haz clic en la X para ingresar manualmente.
            </p>
          )}
        </div>

        {/* Show customer fields only when no client is selected */}
        {!isClientSelected && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name={'customerName' as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo *</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={'customerAliasCbu' as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alias CBU</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={'customerIG' as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={'customerPhone' as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={'customerEmail' as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Sale date - always visible */}
        <div className={!isClientSelected ? 'mt-4' : 'mt-0'}>
          <FormField
            control={control}
            name={'saleDate' as Path<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de venta</FormLabel>
                <FormControl>
                  <DatePicker
                    date={
                      field.value
                        ? (() => {
                            const parsedDate = parseISO(field.value)
                            return isValid(parsedDate) ? parsedDate : undefined
                          })()
                        : undefined
                    }
                    onDateChange={(date) =>
                      field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                    }
                    placeholder={disabled ? '' : 'Seleccionar fecha'}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}
