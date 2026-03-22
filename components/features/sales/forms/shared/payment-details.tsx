'use client'

import { useEffect, useRef } from 'react'
import { Input } from '@/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { DatePicker } from '@/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { Textarea } from '@/ui/textarea'
import { Button } from '@/ui/button'
import { ShoppingCart, Plus, Trash2 } from 'lucide-react'
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
  FieldArrayPath,
  Path,
  PathValue,
  useFieldArray,
  UseFormWatch,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form'
import { useSaleSelection } from './cart-selection/use-sale-selection'
import type { PaymentFormValues } from '@/lib/schemas/sales'

const USD_EXCHANGE_RATE = '1'

// Format number with "." for thousands and "," for decimals
const formatLocaleNumber = (
  value: number | string | undefined | null
): string => {
  if (value === undefined || value === null || value === '') return ''
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return ''

  // Split into integer and decimal parts
  const parts = num.toFixed(2).split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1]

  // Add thousands separators (.)
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  // Combine with comma as decimal separator
  return `${formattedInteger},${decimalPart}`
}

// Parse locale-formatted number back to standard format (for form submission)
const parseLocaleNumber = (value: string): string => {
  if (!value) return ''
  // Remove thousands separators (.) and replace decimal separator (,) with (.)
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? '' : num.toString()
}

interface PaymentDetailsProps<T extends FieldValues> {
  control: Control<T>
  watch: UseFormWatch<T>
  setValue: UseFormSetValue<T>
  disabled?: boolean
  selection?: ReturnType<typeof useSaleSelection>
}

export function PaymentDetails<T extends FieldValues>({
  control,
  watch,
  setValue,
  disabled,
  selection,
}: PaymentDetailsProps<T>) {
  const updateTotalPriceWithSurcharges =
    selection?.updateTotalPriceWithSurcharges

  const { fields, append, remove } = useFieldArray<T>({
    control,
    name: 'payments' as FieldArrayPath<T>,
  })

  const autoTenderedValuesRef = useRef<Record<string, string | undefined>>({})
  const lastCurrencyRef = useRef<Record<string, string | undefined>>({})
  const focusedFieldsRef = useRef<Record<string, boolean>>({})

  // Use useWatch to reactively subscribe to payment changes
  const payments = useWatch({
    control,
    name: 'payments' as Path<T>,
  })

  const addPayment = () => {
    append({
      amount: '',
      baseAmount: '',
      paymentMethod: 'cash',
      currency: 'USD',
      exchangeRate: '',
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
      surchargePercentage: '',
      convertedAmount: '',
      amountTendered: '',
      changeAmount: '',
    } as Partial<PaymentFormValues> as PathValue<T, FieldArrayPath<T>>)
  }

  const totalPrice = parseFloat(watch('totalPrice' as Path<T>) || '0') || 0
  const subtotalPrice =
    parseFloat(watch('subtotalPrice' as Path<T>) || '0') || 0

  // Calculate totals from payments
  const { totalSurcharges, totalPayments } = fields.reduce(
    (acc, _, index) => {
      const baseAmount = parseFloat(
        watch(`payments.${index}.baseAmount` as Path<T>) || '0'
      )
      const amount = parseFloat(
        watch(`payments.${index}.amount` as Path<T>) || '0'
      )
      const surcharge = amount - baseAmount

      return {
        totalBasePayments: acc.totalBasePayments + baseAmount,
        totalSurcharges: acc.totalSurcharges + surcharge,
        totalPayments: acc.totalPayments + amount,
      }
    },
    { totalBasePayments: 0, totalSurcharges: 0, totalPayments: 0 }
  )

  const remainingAmount = totalPrice - totalPayments

  // Update totalPrice to include surcharges, but never decrease below subtotal_price
  // totalPrice = subtotal_price + (sum of surcharges)
  useEffect(() => {
    if (subtotalPrice > 0) {
      // Calculate the target totalPrice: subtotal price + current surcharges
      const targetTotalPrice = subtotalPrice + totalSurcharges

      // Always update the form field
      setValue(
        'totalPrice' as Path<T>,
        targetTotalPrice.toFixed(2) as PathValue<T, Path<T>>,
        {
          shouldValidate: false,
        }
      )

      // Update the cart state if selection is provided
      if (updateTotalPriceWithSurcharges) {
        updateTotalPriceWithSurcharges(targetTotalPrice, totalSurcharges)
      }
    }
  }, [totalSurcharges, subtotalPrice, setValue, updateTotalPriceWithSurcharges])

  // Top-level useEffect to handle all payment calculations
  useEffect(() => {
    if (!payments || disabled) return

    fields.forEach((field, index) => {
      const paymentId = field.id
      const currency = watch(`payments.${index}.currency` as Path<T>)
      const amount = watch(`payments.${index}.amount` as Path<T>)
      const baseAmount = watch(`payments.${index}.baseAmount` as Path<T>)
      const paymentMethod = watch(`payments.${index}.paymentMethod` as Path<T>)
      const exchangeRate = watch(`payments.${index}.exchangeRate` as Path<T>)
      const surchargePercentage = watch(
        `payments.${index}.surchargePercentage` as Path<T>
      )
      const amountTendered = watch(
        `payments.${index}.amountTendered` as Path<T>
      )
      const previousCurrency = lastCurrencyRef.current[paymentId]
      const currencyChanged = previousCurrency !== currency

      // Apply surcharge to amount for transfer/crypto payments, or sync base_amount with amount
      if (baseAmount) {
        const baseNum = parseFloat(baseAmount || '0')
        const surchargeNum = parseFloat(surchargePercentage || '0')

        // Calculate amount with surcharge for transfer/crypto, or just use base for cash
        const calculatedAmount =
          (paymentMethod === 'transfer' || paymentMethod === 'crypto') &&
          surchargeNum > 0
            ? baseNum * (1 + surchargeNum / 100)
            : baseNum

        if (!isNaN(calculatedAmount)) {
          const amountStr = calculatedAmount.toFixed(2)
          const currentAmount = watch(`payments.${index}.amount` as Path<T>)

          if (currentAmount !== amountStr) {
            setValue(
              `payments.${index}.amount` as Path<T>,
              amountStr as PathValue<T, Path<T>>,
              {
                shouldValidate: false,
              }
            )
          }
        }
      }

      // Calculate converted_amount and amount_tendered for ARS payments
      // Note: amount already includes surcharge, so we only apply exchange rate
      if (currency === 'ARS' && exchangeRate) {
        const amountNum = parseFloat(amount || '0')
        const exchangeRateNum = parseFloat(exchangeRate || '0')

        const converted = amountNum * exchangeRateNum

        if (!isNaN(converted) && converted > 0) {
          const convertedStr = converted.toFixed(2)
          const currentConverted = watch(
            `payments.${index}.convertedAmount` as Path<T>
          )

          // Only update if value changed to avoid infinite loops
          if (currentConverted !== convertedStr) {
            setValue(
              `payments.${index}.convertedAmount` as Path<T>,
              convertedStr as PathValue<T, Path<T>>,
              { shouldValidate: false }
            )

            // Update amount_tendered to match converted_amount
            const currentTendered = watch(
              `payments.${index}.amountTendered` as Path<T>
            )
            if (currentTendered !== convertedStr) {
              setValue(
                `payments.${index}.amountTendered` as Path<T>,
                convertedStr as PathValue<T, Path<T>>,
                { shouldValidate: false }
              )
            }
          }
        }
      }

      // Calculate change_amount for ARS
      if (currency === 'ARS') {
        const tenderedNum = parseFloat(amountTendered || '0')
        const convertedAmount = watch(
          `payments.${index}.convertedAmount` as Path<T>
        )
        const convertedNum = parseFloat(convertedAmount || '0')

        const change = Math.max(0, tenderedNum - convertedNum)

        if (!isNaN(change)) {
          const changeStr = change.toFixed(2)
          const currentChange = watch(
            `payments.${index}.changeAmount` as Path<T>
          )

          // Only update if value changed
          if (currentChange !== changeStr) {
            setValue(
              `payments.${index}.changeAmount` as Path<T>,
              changeStr as PathValue<T, Path<T>>,
              { shouldValidate: false }
            )
          }
        }
      }

      // Handle USD-specific logic
      if (currency === 'USD') {
        if (exchangeRate !== USD_EXCHANGE_RATE) {
          setValue(
            `payments.${index}.exchangeRate` as Path<T>,
            USD_EXCHANGE_RATE as PathValue<T, Path<T>>,
            { shouldValidate: false }
          )
        }

        const convertedValue = watch(
          `payments.${index}.convertedAmount` as Path<T>
        )

        if (convertedValue) {
          setValue(
            `payments.${index}.convertedAmount` as Path<T>,
            '' as PathValue<T, Path<T>>,
            { shouldValidate: false }
          )
        }

        const amountNum = parseFloat(amount || '0')
        let tenderedValue = amountTendered ?? ''
        const lastAutoTendered = autoTenderedValuesRef.current[paymentId]

        if (
          lastAutoTendered !== undefined &&
          tenderedValue &&
          tenderedValue !== lastAutoTendered
        ) {
          autoTenderedValuesRef.current[paymentId] = undefined
        }

        if (amountNum > 0) {
          const nextTenderedValue = amountNum.toFixed(2)
          const hasAutoTendered =
            autoTenderedValuesRef.current[paymentId] !== undefined

          const shouldSyncTendered =
            (hasAutoTendered && tenderedValue !== nextTenderedValue) ||
            (!hasAutoTendered && (currencyChanged || tenderedValue === ''))

          if (shouldSyncTendered) {
            setValue(
              `payments.${index}.amountTendered` as Path<T>,
              nextTenderedValue as PathValue<T, Path<T>>,
              { shouldValidate: false }
            )
            autoTenderedValuesRef.current[paymentId] = nextTenderedValue
            tenderedValue = nextTenderedValue
          }
        } else {
          autoTenderedValuesRef.current[paymentId] = undefined
        }

        const tenderedNum = parseFloat(tenderedValue || '0')
        const change = Math.max(0, tenderedNum - amountNum)
        const changeStr = change.toFixed(2)
        const currentChange = watch(`payments.${index}.changeAmount` as Path<T>)

        if (currentChange !== changeStr) {
          setValue(
            `payments.${index}.changeAmount` as Path<T>,
            changeStr as PathValue<T, Path<T>>,
            { shouldValidate: false }
          )
        }
      } else {
        autoTenderedValuesRef.current[paymentId] = undefined
      }

      lastCurrencyRef.current[paymentId] = currency
    })
  }, [payments, fields, setValue, watch, disabled])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Detalles de la Venta
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPayment}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Pago
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name={'totalPrice' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio Total de la Venta *</FormLabel>
              <FormControl>
                <Input
                  name={field.name}
                  value={
                    field.value && !isNaN(parseFloat(field.value))
                      ? formatLocaleNumber(parseFloat(field.value))
                      : ''
                  }
                  type="text"
                  placeholder={disabled ? '' : '999'}
                  disabled={true}
                  readOnly
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                El precio total se calcula automáticamente
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {fields.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
              <p className="text-sm font-medium">Pagos</p>
              {!disabled && totalPayments > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Total pagado: </span>
                  <span className="font-semibold">
                    ${formatLocaleNumber(totalPayments)}
                  </span>
                  {remainingAmount !== 0 && (
                    <span
                      className={`ml-2 ${
                        remainingAmount > 0
                          ? 'text-orange-600'
                          : 'text-destructive'
                      }`}
                    >
                      {remainingAmount > 0
                        ? `(Falta: $${formatLocaleNumber(remainingAmount)})`
                        : `(Exceso: $${formatLocaleNumber(
                            Math.abs(remainingAmount)
                          )})`}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="p-4 border rounded-lg space-y-4 relative"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
              <h4 className="font-medium text-sm">Pago #{index + 1}</h4>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name={`payments.${index}.baseAmount` as Path<T>}
                render={({ field }) => {
                  const paymentMethod = watch(
                    `payments.${index}.paymentMethod` as Path<T>
                  )
                  const surchargePercentage = parseFloat(
                    watch(`payments.${index}.surchargePercentage` as Path<T>) ||
                      '0'
                  )
                  const amount = watch(`payments.${index}.amount` as Path<T>)
                  const hasSurcharge =
                    (paymentMethod === 'transfer' ||
                      paymentMethod === 'crypto') &&
                    surchargePercentage > 0 &&
                    amount

                  const fieldKey = `baseAmount-${index}`
                  const isFocused = focusedFieldsRef.current[fieldKey] || false

                  // When focused, show raw value; when not focused, show formatted
                  const displayValue = isFocused
                    ? field.value ?? ''
                    : field.value && !isNaN(parseFloat(field.value))
                    ? formatLocaleNumber(parseFloat(field.value))
                    : ''

                  return (
                    <FormItem>
                      <FormLabel>Monto del Pago *</FormLabel>
                      <FormControl>
                        <Input
                          name={field.name}
                          value={displayValue}
                          onChange={(e) => {
                            const inputValue = e.target.value
                            // When focused, allow free typing - accept both . and , as decimal separator
                            // Store the value as-is, we'll parse it on blur
                            if (isFocused) {
                              // Allow typing freely, accepting both . and , for decimals
                              // Replace comma with dot for internal storage
                              const normalized = inputValue.replace(',', '.')
                              field.onChange(normalized)
                            } else {
                              // If somehow onChange fires when not focused, parse it
                              const parsed = parseLocaleNumber(inputValue)
                              field.onChange(parsed)
                            }
                          }}
                          onFocus={() => {
                            focusedFieldsRef.current[fieldKey] = true
                            // When focusing, ensure we show the raw numeric value
                            if (
                              field.value &&
                              !isNaN(parseFloat(field.value))
                            ) {
                              field.onChange(parseFloat(field.value).toString())
                            }
                          }}
                          onBlur={() => {
                            focusedFieldsRef.current[fieldKey] = false
                            // Parse and format on blur
                            if (field.value) {
                              const num = parseFloat(field.value)
                              if (!isNaN(num)) {
                                field.onChange(num.toFixed(2))
                              }
                            }
                          }}
                          type="text"
                          placeholder={disabled ? '' : '999,00'}
                          disabled={disabled}
                          required
                        />
                      </FormControl>
                      {hasSurcharge && (
                        <p className="text-xs text-green-600 font-medium">
                          Total con recargo (
                          {formatLocaleNumber(surchargePercentage)}%): $
                          {formatLocaleNumber(parseFloat(amount))}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              {/* Hidden field to store calculated amount with surcharge */}
              <FormField
                control={control}
                name={`payments.${index}.amount` as Path<T>}
                render={({ field }) => (
                  <input type="hidden" {...field} value={field.value ?? ''} />
                )}
              />

              <FormField
                control={control}
                name={`payments.${index}.paymentDate` as Path<T>}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Pago</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={
                          field.value
                            ? (() => {
                                const parsedDate = parseISO(field.value)
                                return isValid(parsedDate)
                                  ? parsedDate
                                  : undefined
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

              <FormField
                control={control}
                name={`payments.${index}.paymentMethod` as Path<T>}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                          // Set default surcharge for transfer/crypto
                          if (value === 'transfer' || value === 'crypto') {
                            // 3% for transfer, 1% for crypto
                            const defaultSurcharge =
                              value === 'transfer' ? '3' : '1'
                            setValue(
                              `payments.${index}.surchargePercentage` as Path<T>,
                              defaultSurcharge as PathValue<T, Path<T>>
                            )
                          } else if (value === 'cash') {
                            // Clear surcharge for cash payments
                            setValue(
                              `payments.${index}.surchargePercentage` as Path<T>,
                              '' as PathValue<T, Path<T>>
                            )
                          }
                        }}
                        disabled={disabled}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={disabled ? '' : 'Seleccionar'}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Efectivo</SelectItem>
                          <SelectItem value="transfer">
                            Transferencia
                          </SelectItem>
                          <SelectItem value="crypto">Cripto</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Surcharge Percentage - Only for transfer/crypto */}
              <FormField
                control={control}
                name={`payments.${index}.paymentMethod` as Path<T>}
                render={({ field: paymentMethodField }) => (
                  <>
                    {(paymentMethodField.value === 'transfer' ||
                      paymentMethodField.value === 'crypto') && (
                      <FormField
                        control={control}
                        name={
                          `payments.${index}.surchargePercentage` as Path<T>
                        }
                        render={({ field: surchargeField }) => {
                          const paymentMethod = watch(
                            `payments.${index}.paymentMethod` as Path<T>
                          )
                          return (
                            <FormItem>
                              <FormLabel>Recargo (%)</FormLabel>
                              <FormControl>
                                <Input
                                  {...surchargeField}
                                  value={surchargeField.value ?? ''}
                                  type="number"
                                  placeholder={
                                    disabled
                                      ? ''
                                      : paymentMethod === 'crypto'
                                      ? '1'
                                      : '3'
                                  }
                                  disabled={disabled}
                                  step="0.01"
                                  min="0"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )
                        }}
                      />
                    )}
                  </>
                )}
              />

              <FormField
                control={control}
                name={`payments.${index}.currency` as Path<T>}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={disabled}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={disabled ? '' : 'Seleccionar'}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">Dólares (USD)</SelectItem>
                          <SelectItem value="ARS">Pesos (ARS)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`payments.${index}.currency` as Path<T>}
                render={({ field: currencyField }) => (
                  <>
                    {currencyField.value === 'ARS' && (
                      <>
                        <FormField
                          control={control}
                          name={`payments.${index}.exchangeRate` as Path<T>}
                          render={({ field: exchangeRateField }) => {
                            const fieldKey = `exchangeRate-${index}`
                            const isFocused =
                              focusedFieldsRef.current[fieldKey] || false
                            const displayValue = isFocused
                              ? exchangeRateField.value ?? ''
                              : exchangeRateField.value &&
                                !isNaN(parseFloat(exchangeRateField.value))
                              ? formatLocaleNumber(
                                  parseFloat(exchangeRateField.value)
                                )
                              : ''

                            return (
                              <FormItem>
                                <FormLabel>
                                  Tipo de Cambio (USD → ARS)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    name={exchangeRateField.name}
                                    value={displayValue}
                                    onChange={(e) => {
                                      const inputValue = e.target.value
                                      // When focused, allow free typing
                                      if (isFocused) {
                                        const normalized = inputValue.replace(
                                          ',',
                                          '.'
                                        )
                                        exchangeRateField.onChange(normalized)
                                      } else {
                                        const parsed =
                                          parseLocaleNumber(inputValue)
                                        exchangeRateField.onChange(parsed)
                                      }
                                    }}
                                    onFocus={() => {
                                      focusedFieldsRef.current[fieldKey] = true
                                      // When focusing, ensure we show the raw numeric value
                                      if (
                                        exchangeRateField.value &&
                                        !isNaN(
                                          parseFloat(exchangeRateField.value)
                                        )
                                      ) {
                                        exchangeRateField.onChange(
                                          parseFloat(
                                            exchangeRateField.value
                                          ).toString()
                                        )
                                      }
                                    }}
                                    onBlur={() => {
                                      focusedFieldsRef.current[fieldKey] = false
                                      // Parse and format on blur
                                      if (exchangeRateField.value) {
                                        const num = parseFloat(
                                          exchangeRateField.value
                                        )
                                        if (!isNaN(num)) {
                                          exchangeRateField.onChange(
                                            num.toFixed(2)
                                          )
                                        }
                                      }
                                    }}
                                    type="text"
                                    placeholder={disabled ? '' : '1.000,00'}
                                    disabled={disabled}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />

                        {/* Converted Amount - Auto-calculated */}
                        <FormField
                          control={control}
                          name={`payments.${index}.convertedAmount` as Path<T>}
                          render={({ field: convertedField }) => (
                            <FormItem>
                              <FormLabel>Conversión a pagar (en ARS)</FormLabel>
                              <FormControl>
                                <Input
                                  name={convertedField.name}
                                  value={
                                    convertedField.value &&
                                    !isNaN(parseFloat(convertedField.value))
                                      ? formatLocaleNumber(
                                          parseFloat(convertedField.value)
                                        )
                                      : ''
                                  }
                                  type="text"
                                  placeholder={disabled ? '' : '0,00'}
                                  disabled={true}
                                  readOnly
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </>
                )}
              />

              {/* Amount Tendered - User input */}
              <FormField
                control={control}
                name={`payments.${index}.amountTendered` as Path<T>}
                render={({ field: tenderedField }) => {
                  const fieldKey = `amountTendered-${index}`
                  const isFocused = focusedFieldsRef.current[fieldKey] || false
                  const displayValue = isFocused
                    ? tenderedField.value ?? ''
                    : tenderedField.value &&
                      !isNaN(parseFloat(tenderedField.value))
                    ? formatLocaleNumber(parseFloat(tenderedField.value))
                    : ''

                  return (
                    <FormItem>
                      <FormLabel>Abonó</FormLabel>
                      <FormControl>
                        <Input
                          name={tenderedField.name}
                          value={displayValue}
                          onChange={(e) => {
                            const inputValue = e.target.value
                            // When focused, allow free typing
                            if (isFocused) {
                              const normalized = inputValue.replace(',', '.')
                              tenderedField.onChange(normalized)
                            } else {
                              const parsed = parseLocaleNumber(inputValue)
                              tenderedField.onChange(parsed)
                            }
                          }}
                          onFocus={() => {
                            focusedFieldsRef.current[fieldKey] = true
                            // When focusing, ensure we show the raw numeric value
                            if (
                              tenderedField.value &&
                              !isNaN(parseFloat(tenderedField.value))
                            ) {
                              tenderedField.onChange(
                                parseFloat(tenderedField.value).toString()
                              )
                            }
                          }}
                          onBlur={() => {
                            focusedFieldsRef.current[fieldKey] = false
                            // Parse and format on blur
                            if (tenderedField.value) {
                              const num = parseFloat(tenderedField.value)
                              if (!isNaN(num)) {
                                tenderedField.onChange(num.toFixed(2))
                              }
                            }
                          }}
                          type="text"
                          placeholder={disabled ? '' : '0,00'}
                          disabled={disabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              {/* Change Amount - Auto-calculated */}
              <FormField
                control={control}
                name={`payments.${index}.changeAmount` as Path<T>}
                render={({ field: changeField }) => (
                  <FormItem>
                    <FormLabel>Dar de Vuelto</FormLabel>
                    <FormControl>
                      <Input
                        name={changeField.name}
                        value={
                          changeField.value &&
                          !isNaN(parseFloat(changeField.value))
                            ? formatLocaleNumber(parseFloat(changeField.value))
                            : ''
                        }
                        type="text"
                        placeholder={disabled ? '' : '0,00'}
                        disabled={true}
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`payments.${index}.notes` as Path<T>}
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notas (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={disabled ? '' : 'Información adicional...'}
                        rows={2}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
