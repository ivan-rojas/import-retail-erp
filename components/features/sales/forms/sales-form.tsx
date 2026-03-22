'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog'
import { Loader2, Plus } from 'lucide-react'
import {
  useCreateSale,
  useSaleById,
  useUpdateSale,
} from '@/lib/hooks/use-sales'
import { CustomerInfo } from './shared/customer-info'
import ProductsSelection from './shared/products-selection'
import { useSaleSelection } from './shared/cart-selection/use-sale-selection'
import { SelectedProducts } from './shared/cart-selection/selected-products'
import { PaymentDetails } from './shared/payment-details'
import DeliverySelection from './shared/delivery-details'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { saleFormSchema, SaleFormValues } from '@/lib/schemas/sales'
import {
  convertSaleFormValuesToSaleDTO,
  getSalesFormData,
} from '@/lib/utils/sales'
import { DepositDetails } from './shared/deposit-details'
import { Form } from '@/ui/form'
import { format } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import { PRODUCT_ITEM_BY_IMEI_QUERY_KEY } from '@/lib/hooks/use-inventory'

interface SalesFormProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
  saleId?: string | null
  isReservation?: boolean
  disabled?: boolean
}

export default function SalesForm({
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
  saleId = null,
  isReservation = false,
  disabled = false,
}: SalesFormProps) {
  const createSale = useCreateSale()
  const updateSale = useUpdateSale()
  const { data: sale } = useSaleById(saleId || '')
  const selection = useSaleSelection()
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [error, setError] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const isOpen = controlledOpen ?? open
  const setIsOpen = onOpenChange ?? setOpen

  const deliveryExists = saleId
    ? (sale?.deliveries?.filter((d) => d.delivery_status !== 'cancelled')
        .length ?? 0) > 0
    : true

  const EPSILON = 0.01 // tolerance for floating point comparisons

  useEffect(() => {
    if (sale) {
      selection.setExistingSaleData(sale.sale_items, sale.trade_ins)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale])

  // Populate form with sale data when editing
  useEffect(() => {
    if (sale && saleId) {
      // Use getSalesFormData to extract the form data structure
      const { customerInfo, saleDetails, deposit, delivery } =
        getSalesFormData(sale)

      const formData = {
        customerName: customerInfo.customerName,
        customerIG: customerInfo.customerIG || '',
        customerPhone: customerInfo.customerPhone || '',
        customerEmail: customerInfo.customerEmail || '',
        customerAliasCbu: customerInfo.customerAliasCbu || '',
        subtotalPrice: saleDetails.subtotalPrice || '',
        totalPrice: saleDetails.totalPrice || '',
        saleStatus: sale.status as 'sold' | 'reserved',
        saleDate: sale.sale_date || format(new Date(), 'yyyy-MM-dd'),
        payments: saleDetails.payments,
        deposit: deposit.deposit || '',
        isDefaultDelivery: delivery.isDefaultDelivery,
        deliveryDate: delivery.deliveryDate,
        deliveryTime: delivery.deliveryTime || '',
        deliveryNotes: delivery.deliveryNotes || '',
        clientId: customerInfo.clientId || '',
      }

      // Reset form with sale data
      form.reset(formData)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale, saleId])

  const defaultValues = {
    customerName: '',
    customerIG: '',
    customerPhone: '',
    customerEmail: '',
    customerAliasCbu: '',
    subtotalPrice: selection.state.subtotalPrice,
    totalPrice: selection.state.totalPrice,
    saleStatus: isReservation ? 'reserved' : ('sold' as 'sold' | 'reserved'),
    saleDate: format(new Date(), 'yyyy-MM-dd'),
    payments: [
      {
        baseAmount: '',
        amount: '',
        paymentMethod: 'cash' as 'cash' | 'transfer' | 'crypto',
        currency: 'USD' as 'USD' | 'ARS',
        exchangeRate: '',
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
        surchargePercentage: '',
        convertedAmount: '',
        amountTendered: '',
        changeAmount: '',
      },
    ],
    deposit: '',
    isDefaultDelivery: false,
    deliveryDate: format(new Date(), 'yyyy-MM-dd'),
    deliveryTime: '',
    deliveryNotes: '',
    clientId: '',
  }

  const form = useForm({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      ...defaultValues,
    },
    mode: 'onChange',
  })

  // keep total in sync
  useEffect(() => {
    const rawNetTotal = Number(selection.state.netTotal || 0)
    const rawSurcharge = Number(selection.state.totalSurcharge || 0)
    const netBeforeSurcharge = Math.max(0, rawNetTotal - rawSurcharge)
    const baseSubtotal =
      selection.state.tradeIns.length > 0
        ? netBeforeSurcharge.toFixed(2)
        : selection.state.subtotalPrice
    const targetTotal = selection.state.totalPrice

    const currentSubtotal = form.getValues('subtotalPrice') ?? ''
    const nextSubtotal = baseSubtotal ?? ''

    if (currentSubtotal !== nextSubtotal) {
      form.setValue('subtotalPrice', nextSubtotal)
    }

    const currentTotal = form.getValues('totalPrice') ?? ''
    const nextTotal = targetTotal ?? ''

    if (currentTotal !== nextTotal) {
      form.setValue('totalPrice', nextTotal)
    }
  }, [
    form,
    selection.state.netTotal,
    selection.state.subtotalPrice,
    selection.state.totalPrice,
    selection.state.tradeIns.length,
    selection.state.totalSurcharge,
  ])

  // Handle immediate delivery toggle
  const isDefaultDelivery = form.watch('isDefaultDelivery')
  useEffect(() => {
    if (isDefaultDelivery) {
      const today = new Date()
      form.setValue('deliveryDate', format(today, 'yyyy-MM-dd'))
      form.setValue('deliveryTime', format(today, 'HH:mm'))
      form.setValue('deliveryNotes', '')
    }
  }, [isDefaultDelivery, form])

  useEffect(() => {
    if (saleId) {
      return
    }

    form.setValue('saleStatus', isReservation ? 'reserved' : 'sold')
  }, [isReservation, form, saleId])

  const handleSubmitSale = form.handleSubmit(async (vals: SaleFormValues) => {
    if (!validateSale(vals)) {
      setError(true)
      return
    }

    const saleData = convertSaleFormValuesToSaleDTO(
      vals,
      selection,
      sale || undefined
    )

    if (saleId) {
      await updateSale.mutateAsync({ id: saleId, data: saleData })
    } else {
      await createSale.mutateAsync(saleData)
    }
    
    // Manually remove IMEI query cache to ensure fresh data on next search
    queryClient.removeQueries({
      queryKey: [PRODUCT_ITEM_BY_IMEI_QUERY_KEY],
    })
    
    selection.reset()
    form.reset(defaultValues)
    setIsOpen(false)
    setError(false)
    setErrorMessage('')
  })

  const validateSale = (vals: SaleFormValues) => {
    const hasProducts = selection.state.selectedProducts.length > 0
    const hasServices = selection.state.serviceLines.length > 0
    if (!hasProducts && !hasServices) {
      setErrorMessage('Por favor selecciona al menos un producto o servicio')
      return false
    }

    if (parseFloat(vals.deposit || '0') > parseFloat(vals.totalPrice || '0')) {
      setErrorMessage('El depósito no puede ser mayor al total de la venta')
      return false
    }

    // Validate delivery date/time
    if (!vals.isDefaultDelivery && vals.deliveryDate && !vals.deliveryTime) {
      setErrorMessage(
        'Por favor ingresa una hora de entrega si especificas una fecha'
      )
      return false
    }

    // Validate payments
    if ((!vals.payments || vals.payments.length === 0) && !isReservation) {
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

      totalPayments += parseFloat(payment.amount)

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

    // Validate total payments don't exceed sale price
    const totalPrice = parseFloat(vals.totalPrice || '0')
    if (totalPayments - totalPrice > EPSILON) {
      setErrorMessage(
        `El total de pagos ($${totalPayments.toFixed(
          2
        )}) excede el precio total de la venta ($${totalPrice.toFixed(2)})`
      )
      return false
    }

    // Validate for when !isReservation
    if (!isReservation && !vals.clientId) {
      if (Math.abs(totalPayments - totalPrice) > EPSILON) {
        setErrorMessage(
          `El total de pagos ($${totalPayments.toFixed(
            2
          )}) no coincide con el precio total de la venta ($${totalPrice.toFixed(
            2
          )})`
        )
        return false
      }
    }

    if (isReservation && parseFloat(vals.deposit || '0') > 0) {
      const paymentDeposit = vals.payments.some(
        (payment) =>
          Math.abs(
            parseFloat(payment.amount || '0') - parseFloat(vals.deposit || '0')
          ) < EPSILON
      )
      if (!paymentDeposit) {
        setErrorMessage('Ningún pago coincide con el depósito')
        return false
      }
    }

    return true
  }

  const handleDialogOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen)
    if (!nextOpen) {
      selection.reset()
      form.reset(defaultValues)
      setError(false)
      setErrorMessage('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {isReservation ? 'Nueva Reserva' : 'Nueva Venta'}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {saleId ? 'Editar' : 'Nueva'} {isReservation ? 'Reserva' : 'Venta'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <div className="grid gap-6 py-4">
            {/* Full width sections */}
            {!disabled && (
              <ProductsSelection
                selection={selection}
                isReservation={isReservation}
                saleId={saleId ?? undefined}
              />
            )}
            <SelectedProducts selection={selection} disabled={disabled} />

            {/* 2-column layout for form sections */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <CustomerInfo
                  control={form.control}
                  setValue={form.setValue}
                  watch={form.watch}
                  disabled={disabled}
                />
                {!isReservation && !disabled ? null : (
                  <div className="space-y-4">
                    <DepositDetails
                      control={form.control}
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 h-full">
                <PaymentDetails
                  control={form.control}
                  watch={form.watch}
                  setValue={form.setValue}
                  disabled={disabled}
                  selection={selection}
                />
              </div>
            </div>

            {/* Full width delivery section */}
            <div className="space-y-4">
              <DeliverySelection
                control={form.control}
                disabled={disabled}
                isReservation={isReservation}
                deliveryExists={deliveryExists ?? false}
              />
            </div>

            {error && (
              <div className="text-red-500 text-center">{errorMessage}</div>
            )}
              <Button
                onClick={handleSubmitSale}
                disabled={
                  createSale.isPending || updateSale.isPending || disabled
                }
              >
                {createSale.isPending || updateSale.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </div>
          </DialogBody>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
