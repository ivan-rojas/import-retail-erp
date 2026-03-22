import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Input } from '@/ui/input'
import { ShieldCheck } from 'lucide-react'
import React from 'react'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/ui/form'
import { Control, FieldValues, Path } from 'react-hook-form'

export interface DepositDetailsData {
  deposit: string
}

interface DepositDetailsProps<T extends FieldValues> {
  control: Control<T>
  disabled?: boolean
}

export function DepositDetails<T extends FieldValues>({
  control,
  disabled,
}: DepositDetailsProps<T>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Depósito de Reserva
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 lg:grid-cols-1 gap-2">
        <FormField
          control={control}
          name={'deposit' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto del Depósito (USD)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder={disabled ? '' : 'Ej: 100'}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
