'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/ui/dialog'
import { Button } from '@/ui/button'
import { Form } from '@/ui/form'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useCreateBatchPayments } from '@/lib/hooks/use-clients'
import { PaymentDetails } from '@/components/features/sales/forms/shared/payment-details'
import { format } from 'date-fns'

const clientPaymentSchema = z.object({
  totalPrice: z.string(),
  subtotalPrice: z.string(),
  payments: z.array(
    z.object({
      baseAmount: z.string().min(1, 'Monto requerido'),
      amount: z.string(),
      paymentMethod: z.union([
        z.literal('cash'),
        z.literal('transfer'),
        z.literal('crypto'),
      ]),
      currency: z.union([z.literal('USD'), z.literal('ARS')]),
      exchangeRate: z.string().optional(),
      paymentDate: z.string(),
      notes: z.string().optional(),
      surchargePercentage: z.string().optional(),
      convertedAmount: z.string().optional(),
      amountTendered: z.string().optional(),
      changeAmount: z.string().optional(),
    })
  ),
})

type ClientPaymentFormValues = z.infer<typeof clientPaymentSchema>

interface ClientPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId: string
  saleDate: string
  salePrice: number
  currentBalance: number
  customerName: string
  onSuccess?: () => void
}

export default function ClientPaymentModal({
  open,
  onOpenChange,
  saleId,
  saleDate,
  salePrice,
  currentBalance,
  customerName,
  onSuccess,
}: ClientPaymentModalProps) {
  const createBatchPaymentsMutation = useCreateBatchPayments()

  const form = useForm<ClientPaymentFormValues>({
    resolver: zodResolver(clientPaymentSchema),
    defaultValues: {
      totalPrice: currentBalance.toFixed(2),
      subtotalPrice: currentBalance.toFixed(2),
      payments: [
        {
          baseAmount: currentBalance.toFixed(2),
          amount: currentBalance.toFixed(2),
          paymentMethod: 'cash',
          currency: 'USD',
          exchangeRate: '1',
          paymentDate: format(new Date(), 'yyyy-MM-dd'),
          notes: '',
          surchargePercentage: '',
          convertedAmount: '',
          amountTendered: currentBalance.toFixed(2),
          changeAmount: '0',
        },
      ],
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        totalPrice: currentBalance.toFixed(2),
        subtotalPrice: currentBalance.toFixed(2),
        payments: [
          {
            baseAmount: currentBalance.toFixed(2),
            amount: currentBalance.toFixed(2),
            paymentMethod: 'cash',
            currency: 'USD',
            exchangeRate: '1',
            paymentDate: format(new Date(), 'yyyy-MM-dd'),
            notes: '',
            surchargePercentage: '',
            convertedAmount: '',
            amountTendered: currentBalance.toFixed(2),
            changeAmount: '0',
          },
        ],
      })
    }
  }, [open, currentBalance, form])

  const handleSubmit = async (data: ClientPaymentFormValues) => {
    // Prepare batch payment data
    const paymentsData = data.payments.map((payment) => ({
      amount: parseFloat(payment.amount),
      paymentMethod: payment.paymentMethod as 'cash' | 'transfer' | 'crypto',
      currency: payment.currency as 'USD' | 'ARS',
      exchange_rate: payment.exchangeRate
        ? parseFloat(payment.exchangeRate)
        : 1,
      payment_date: payment.paymentDate,
      payment_notes: payment.notes || null,
      surcharge_percentage: payment.surchargePercentage
        ? parseFloat(payment.surchargePercentage)
        : undefined,
      converted_amount: payment.convertedAmount
        ? parseFloat(payment.convertedAmount)
        : undefined,
      amount_tendered: payment.amountTendered
        ? parseFloat(payment.amountTendered)
        : undefined,
      change_amount: payment.changeAmount
        ? parseFloat(payment.changeAmount)
        : undefined,
      base_amount: parseFloat(payment.baseAmount),
    }))

    // Create all payments atomically via React Query mutation
    createBatchPaymentsMutation.mutate(
      {
        saleId,
        payments: paymentsData,
        saleDate,
      },
      {
        onSuccess: (result) => {
          const paymentCount = result.data?.length ?? paymentsData.length
          toast.success(
            paymentCount === 1
              ? 'Pago registrado correctamente'
              : `${paymentCount} pagos registrados correctamente`
          )
          onOpenChange(false)
          form.reset()
          onSuccess?.()
        },
        onError: (error) => {
          console.error('Error creating payments:', error)
          toast.error(
            error instanceof Error
              ? error.message
              : 'Error al registrar los pagos. Por favor, intente nuevamente.'
          )
        },
      }
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {currentBalance > 0
              ? 'Registrar Pago'
              : currentBalance < 0
              ? 'Registrar Reembolso'
              : 'Sin Saldo Pendiente'}
          </DialogTitle>
          <DialogDescription>
            Cliente: {customerName} | Precio de venta:{' '}
            {formatCurrency(salePrice)} |{' '}
            {currentBalance > 0 ? 'Deuda' : 'Sobrepago'}:{' '}
            {formatCurrency(Math.abs(currentBalance))}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <PaymentDetails<ClientPaymentFormValues>
                control={form.control}
                watch={form.watch}
                setValue={form.setValue}
                disabled={createBatchPaymentsMutation.isPending}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={createBatchPaymentsMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createBatchPaymentsMutation.isPending}
                >
                  {createBatchPaymentsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Pago'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
