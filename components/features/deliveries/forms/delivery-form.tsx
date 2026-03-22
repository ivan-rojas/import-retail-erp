'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Form } from '@/ui/form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog'
import { Truck, ArrowLeft, Check, Plus } from 'lucide-react'
import { SaleDTO } from '@/lib/types/sales'
import SalesSearchByName from './sales-search-by-name'
import DeliverySelection from '@/components/features/sales/forms/shared/delivery-details'
import { useCreateDelivery } from '@/lib/hooks/use-deliveries'
import { toast } from 'sonner'
import { deliveryFormSchema, DeliveryFormData } from '@/lib/schemas/delivery'
import { format } from 'date-fns'
import { es } from 'date-fns/locale/es'

interface DeliveryFormProps {
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export default function DeliveryForm({
  onSuccess,
  trigger,
}: DeliveryFormProps) {
  const [selectedSale, setSelectedSale] = useState<SaleDTO | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  const { mutate: createDelivery } = useCreateDelivery()

  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      isDefaultDelivery: false,
      deliveryDate: '',
      deliveryTime: '',
      deliveryNotes: '',
    },
    mode: 'onChange',
  })

  const handleSaleSelect = (sale: SaleDTO) => {
    setSelectedSale(sale)
  }

  const handleBackToSaleSelection = () => {
    setSelectedSale(null)
  }

  const handleSuccess = () => {
    form.reset()
    setSelectedSale(null)
    setOpen(false)
    setIsSubmitting(false)
    onSuccess?.()
  }

  const onSubmit = (data: DeliveryFormData) => {
    if (!selectedSale) {
      toast.error('Por favor seleccione una venta')
      return
    }

    setIsSubmitting(true)

    const deliveryData = {
      sale_id: selectedSale.id,
      reservation_id: selectedSale.reservations?.[0]?.id || undefined,
      delivery_date: data.isDefaultDelivery
        ? new Date().toISOString()
        : `${data.deliveryDate}T${data.deliveryTime || '00:00:00'}`,
      delivery_notes: data.deliveryNotes,
      delivery_status: data.isDefaultDelivery
        ? 'delivered'
        : ('pending' as 'delivered' | 'pending' | 'cancelled'),
      delivery_user_id: selectedSale.seller_id,
      is_default: data.isDefaultDelivery,
      created_by: selectedSale.seller_id,
      updated_by: selectedSale.seller_id,
    }

    createDelivery(deliveryData, {
      onSuccess: () => {
        toast.success('Entrega creada exitosamente')
        handleSuccess()
      },
      onError: (error: Error) => {
        toast.error(`Error al crear entrega: ${error.message}`)
      },
      onSettled: () => {
        setIsSubmitting(false)
      },
    })
  }

  const handleDialogOpenChange = (open: boolean) => {
    setOpen(open)
    if (!open) {
      form.reset()
      setSelectedSale(null)
      setIsSubmitting(false)
    }
  }

  const getSaleStatus = (sale: SaleDTO) => {
    if (sale.status === 'sold') return 'Vendido'
    if (sale.status === 'reserved') return 'Reservado'
    if (sale.status === 'cancelled') return 'Cancelado'
    if (sale.status === 'deleted') return 'Eliminado'
    return 'Pendiente'
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Crear Entrega
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Crear Nueva Entrega
          </DialogTitle>
        </DialogHeader>

        {!selectedSale ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Seleccione la venta para la cual desea crear una entrega
            </p>
            <SalesSearchByName onSaleSelect={handleSaleSelect} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selected Sale Info */}
            <Card className="bg-muted/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Venta Seleccionada</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToSaleSelection}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Cambiar Venta
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cliente:</span>
                    <p className="font-medium">{selectedSale.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fecha:</span>
                    <p>
                      {format(new Date(selectedSale.sale_date), 'dd/MM/yyyy', {
                        locale: es,
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span>
                    <p className="font-medium">${selectedSale.sale_price}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estado:</span>
                    <p className="capitalize">{getSaleStatus(selectedSale)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Form */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <DeliverySelection
                  control={form.control}
                  isReservation={selectedSale.status === 'reserved'}
                  deliveryExists={true}
                />

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      'Creando...'
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Crear Entrega
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
