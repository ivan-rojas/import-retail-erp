'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  completeSaleFormSchema,
  CompleteSaleFormValues,
} from '@/lib/schemas/sales'
import { PaymentDetails } from './shared/payment-details'
import { useCompleteSale, useSaleById } from '@/lib/hooks/use-sales'
import { convertPaymentFormValuesToPaymentDTO } from '@/lib/utils/payment'
import { toast } from 'sonner'
import { Form } from '@/ui/form'
import { Loader2 } from 'lucide-react'

interface CompleteSalesFormProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  saleId?: string | null
}

export default function CompleteSalesForm({
  open: controlledOpen,
  onOpenChange,
  disabled = false,
  saleId = null,
}: CompleteSalesFormProps) {
  const { data: sale } = useSaleById(saleId || '')
  const completeSale = useCompleteSale()

  const [open, setOpen] = useState(false)
  const [error, setError] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const isOpen = controlledOpen ?? open
  const setIsOpen = onOpenChange ?? setOpen

  const EPSILON = 0.01 // tolerance for floating point comparisons

  useEffect(() => {
    if (sale) {
      // Calculate total already paid (sum of all existing payments)
      const totalAlreadyPaid =
        sale?.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0

      // Calculate remaining amount to pay
      const rawAmountToPay = (sale?.sale_price || 0) - totalAlreadyPaid
      const remainingAmount = rawAmountToPay > EPSILON ? rawAmountToPay : 0

      const existingPayments =
        sale?.payments?.map((payment) => ({
          baseAmount: (payment.base_amount ?? 0).toFixed(2),
          amount: (payment.amount ?? 0).toFixed(2),
          paymentMethod: payment.payment_method,
          currency: payment.currency,
          exchangeRate:
            payment.usd_exchange_rate !== undefined
              ? payment.usd_exchange_rate.toString()
              : '',
          paymentDate: payment.payment_date
            ? payment.payment_date.slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          notes: payment.payment_notes || '',
          surchargePercentage:
            payment.surcharge_percentage !== undefined &&
            payment.surcharge_percentage !== null
              ? payment.surcharge_percentage.toString()
              : '',
          convertedAmount:
            payment.converted_amount !== undefined &&
            payment.converted_amount !== null
              ? payment.converted_amount.toString()
              : '',
          amountTendered:
            payment.amount_tendered !== undefined &&
            payment.amount_tendered !== null
              ? payment.amount_tendered.toString()
              : '',
          changeAmount:
            payment.change_amount !== undefined &&
            payment.change_amount !== null
              ? payment.change_amount.toString()
              : '',
        })) || []

      const remainingPayment = {
        baseAmount: Math.max(remainingAmount, 0).toFixed(2),
        amount: Math.max(remainingAmount, 0).toFixed(2),
        paymentMethod: 'cash' as 'cash' | 'transfer' | 'crypto',
        currency: 'USD' as 'USD' | 'ARS',
        exchangeRate:
          sale?.primary_payment?.usd_exchange_rate !== undefined &&
          sale?.primary_payment?.usd_exchange_rate !== null
            ? sale.primary_payment.usd_exchange_rate.toString()
            : '',
        paymentDate: new Date().toISOString().slice(0, 10),
        notes: '',
        surchargePercentage: '',
        convertedAmount: '',
        amountTendered: '',
        changeAmount: '',
      }

      const paymentsFormValues =
        remainingAmount > EPSILON || existingPayments.length === 0
          ? [...existingPayments, remainingPayment]
          : existingPayments

      form.reset({
        subtotalPrice: sale?.sale_price.toFixed(2) || '',
        totalPrice: sale?.sale_price.toFixed(2) || '',
        deposit: totalAlreadyPaid.toFixed(2) || '',
        amountToPay: Math.max(rawAmountToPay, 0).toFixed(2) || '',
        payments: paymentsFormValues,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale])

  const defaultValues = {
    subtotalPrice: '',
    totalPrice: '',
    deposit: '',
    amountToPay: '',
    payments: [
      {
        baseAmount: '',
        amount: '',
        paymentMethod: 'cash' as 'cash' | 'transfer' | 'crypto',
        currency: 'USD' as 'USD' | 'ARS',
        exchangeRate: '',
        paymentDate: new Date().toISOString().slice(0, 10),
        notes: '',
        surchargePercentage: '',
        convertedAmount: '',
        amountTendered: '',
        changeAmount: '',
      },
    ],
  }

  const form = useForm({
    resolver: zodResolver(completeSaleFormSchema),
    defaultValues,
    mode: 'onChange',
  })

  const handleSubmitCompleteSale = form.handleSubmit(
    async (vals: CompleteSaleFormValues) => {
      const amountToPay = parseFloat(vals.amountToPay || '0')

      if (amountToPay !== 0) {
        // Validate payments
        if (!validateCompleteSale(vals)) {
          setError(true)
          return
        }
      }

      const paymentData =
        amountToPay !== 0 ? convertPaymentFormValuesToPaymentDTO(vals) : []

      try {
        await completeSale.mutateAsync({
          id: sale?.id || '',
          data: paymentData,
          savePayments: amountToPay !== 0,
        })
        toast.success('Venta completada exitosamente')
        setError(false)
        setErrorMessage('')
        setIsOpen(false)
        form.reset(defaultValues)
      } catch (error) {
        console.error('Error al completar venta:', error)
        toast.error('Error al completar venta')
      }
    }
  )

  const validateCompleteSale = (vals: CompleteSaleFormValues) => {
    if (!vals.payments || vals.payments.length === 0) {
      setErrorMessage('Por favor agrega al menos un pago')
      return false
    }

    let totalPayments = 0

    for (let i = 0; i < vals.payments.length; i++) {
      const payment = vals.payments[i]

      if (!payment.amount || parseFloat(payment.amount) <= 0) {
        setErrorMessage(
          `Por favor ingresa un monto válido para el pago #${i + 1}`
        )
        return false
      }

      totalPayments += parseFloat(payment.amount || '0')

      if (
        payment.currency === 'ARS' &&
        parseFloat(payment.exchangeRate || '0') === 0
      ) {
        setErrorMessage(
          `Por favor ingresa un tipo de cambio para el pago #${i + 1} en ARS`
        )
        return false
      }

      if (payment.paymentMethod === 'crypto' && payment.currency === 'ARS') {
        setErrorMessage(
          `Por favor selecciona otra moneda para el pago #${i + 1} en cripto`
        )
        return false
      }
    }

    const totalSalePrice = parseFloat(form.watch('totalPrice') || '0')

    if (totalPayments - totalSalePrice > EPSILON) {
      setErrorMessage(
        `El total de pagos ($${totalPayments.toFixed(
          2
        )}) excede el monto pendiente ($${totalSalePrice.toFixed(2)})`
      )
      return false
    }

    if (Math.abs(totalPayments - totalSalePrice) > EPSILON) {
      setErrorMessage(
        `El total de pagos ($${totalPayments.toFixed(
          2
        )}) no coincide con el monto pendiente ($${totalSalePrice.toFixed(
          2
        )}). Debe pagar el monto completo para completar la venta.`
      )
      return false
    }

    return true
  }

  const handleDialogOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen)
    if (!nextOpen) {
      form.reset(defaultValues)
      setError(false)
      setErrorMessage('')
    }
  }

  const NoPayments = () => {
    return (
      <div className="border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No hay pagos pendientes
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Esta venta ya ha sido pagada en su totalidad. Simplemente presiona
              &quot;Completar Venta&quot; para convertir esta reserva en una
              venta completada.
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span>Monto pendiente:</span>
              <span className="text-lg font-bold">$0.00</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Completar Venta</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <div className="grid gap-6 py-4">
            {/* Sale Details Section */}
            <div className="space-y-4">
              {parseFloat(form.watch('amountToPay') || '0') === 0 ? (
                <NoPayments />
              ) : (
                <PaymentDetails
                  control={form.control}
                  watch={form.watch}
                  setValue={form.setValue}
                  disabled={disabled}
                />
              )}
            </div>

            {/* Payment Summary Cart */}
            <div className="space-y-4 hidden">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="text-xl">🛒</span>
                  Resumen de Pago
                </h3>

                <div className="space-y-3">
                  {/* Total Price */}
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm font-medium text-muted-foreground">
                      Precio Total:
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      ${parseFloat(form.watch('totalPrice') || '0').toFixed(2)}
                    </span>
                  </div>

                  {/* Already Paid (all existing payments) */}
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm font-medium text-muted-foreground">
                      Ya Pagado:
                    </span>
                    <span className="text-base font-semibold text-muted-foreground">
                      - ${parseFloat(form.watch('deposit') || '0').toFixed(2)}
                    </span>
                  </div>

                  {/* Amount to Pay */}
                  <div className="flex justify-between items-center py-3 rounded-md px-3">
                    <span className="text-base font-semibold text-muted-foreground">
                      Monto Pendiente:
                    </span>
                    <span className="text-xl font-bold text-foreground">
                      ${parseFloat(form.watch('amountToPay') || '0').toFixed(2)}
                    </span>
                  </div>

                  {/* New Payments Total */}
                  {form.watch('payments') &&
                    form.watch('payments').length > 0 && (
                      <div className="flex justify-between items-center py-3 rounded-md px-3">
                        <span className="text-base font-semibold text-muted-foreground">
                          Total a Pagar Ahora:
                        </span>
                        <span className="text-xl font-bold text-foreground">
                          $
                          {form
                            .watch('payments')
                            .reduce(
                              (sum, payment) =>
                                sum + parseFloat(payment.amount || '0'),
                              0
                            )
                            .toFixed(2)}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>
            {error && <div className="text-destructive">{errorMessage}</div>}
              <Button
                onClick={handleSubmitCompleteSale}
                disabled={disabled || completeSale.isPending}
              >
                {completeSale.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completando venta...
                  </>
                ) : (
                  'Completar Venta'
                )}
              </Button>
            </div>
          </DialogBody>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
