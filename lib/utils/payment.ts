import { PaymentDTO } from '@/lib/types/payment'
import { CompleteSaleFormValues } from '@/lib/schemas/sales'
import { parseOptionalFloat } from '../utils'

export const convertPaymentFormValuesToPaymentDTO = (
  values: CompleteSaleFormValues
): PaymentDTO[] => {
  return values.payments.map((payment) => ({
    base_amount: parseFloat(payment.baseAmount) || 0,
    amount: parseFloat(payment.amount) || 0,
    payment_method: payment.paymentMethod,
    currency: payment.currency,
    usd_exchange_rate: parseFloat(payment.exchangeRate || '1'),
    payment_date: payment.paymentDate,
    payment_notes: payment.notes || null,
    surcharge_percentage: parseOptionalFloat(payment.surchargePercentage),
    converted_amount: parseOptionalFloat(payment.convertedAmount),
    amount_tendered: parseOptionalFloat(payment.amountTendered),
    change_amount: parseOptionalFloat(payment.changeAmount),
  }))
}
