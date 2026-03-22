'use client'

import { Textarea } from '@/ui/textarea'
import { Checkbox } from '@/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { DatePicker } from '@/ui/date-picker'
import { Truck, Calendar, FileText, TriangleAlert, Plus } from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
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
  useWatch,
  useFormContext,
  PathValue,
} from 'react-hook-form'
import { Button } from '@/ui/button'
import { useRouter } from 'next/navigation'

export interface DeliveryData {
  isDefaultDelivery: boolean
  deliveryDate: string
  deliveryTime?: string
  deliveryNotes: string
}

interface DeliveryDetailsProps<T extends FieldValues> {
  control: Control<T>
  isReservation?: boolean
  disabled?: boolean
  deliveryExists?: boolean
}

export default function DeliveryDetails<T extends FieldValues>({
  control,
  isReservation = false,
  disabled,
  deliveryExists = false,
}: DeliveryDetailsProps<T>) {
  const router = useRouter()
  const { setValue } = useFormContext<T>()
  const isDefaultDelivery = useWatch({
    control,
    name: 'isDefaultDelivery' as Path<T>,
  })
  const deliveryTime = useWatch({
    control,
    name: 'deliveryTime' as Path<T>,
  })

  if (!deliveryExists) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Información de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-yellow-500" />
            No hay información de entrega.
          </p>
          <p>
            Por favor, programe una nueva entrega o elimine la venta para
            liberar los productos asociados.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/deliveries')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Programe una nueva entrega
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          {isReservation ? 'Entrega Programada' : 'Información de Entrega'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isReservation && (
          <>
            <FormField
              control={control}
              name={'isDefaultDelivery' as Path<T>}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      id="defaultDelivery"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                      }}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormLabel htmlFor="defaultDelivery" className="mb-1">
                    Entrega inmediata (venta presencial)
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isDefaultDelivery && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <p>
                  ✓ Entrega inmediata - La venta se considera entregada al
                  momento del registro.
                </p>
              </div>
            )}
          </>
        )}

        {!isDefaultDelivery && (
          <div className="space-y-4">
            <FormField
              control={control}
              name={'deliveryDate' as Path<T>}
              render={({ field: dateField }) => (
                <FormItem className="w-1/2">
                  <FormLabel className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Fecha y Hora de Entrega *
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      date={
                        dateField.value
                          ? (() => {
                              const parsedDate = parseISO(dateField.value)
                              return isValid(parsedDate)
                                ? parsedDate
                                : undefined
                            })()
                          : undefined
                      }
                      onDateChange={(date) =>
                        dateField.onChange(
                          date ? format(date, 'yyyy-MM-dd') : ''
                        )
                      }
                      placeholder={disabled ? '' : 'Seleccionar fecha'}
                      showTime={true}
                      timeLabel="Hora de Entrega"
                      timeValue={deliveryTime || ''}
                      onTimeChange={(time) => {
                        setValue(
                          'deliveryTime' as Path<T>,
                          (time || '') as PathValue<T, Path<T>>
                        )
                      }}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={'deliveryTime' as Path<T>}
              render={({ field: timeField }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <input
                      type="hidden"
                      {...timeField}
                      value={timeField.value || ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={'deliveryNotes' as Path<T>}
              render={({ field: notesField }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Notas de Entrega
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...notesField}
                      placeholder={
                        isReservation
                          ? disabled
                            ? ''
                            : 'Dirección de entrega, horario preferido, instrucciones especiales...'
                          : 'Instrucciones especiales de entrega, dirección, etc.'
                      }
                      rows={3}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
