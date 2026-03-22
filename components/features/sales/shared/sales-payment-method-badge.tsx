import { PaymentMethod } from '@/lib/enums'
import { Badge } from '@/ui/badge'
import { DollarSign, CreditCard, Bitcoin } from 'lucide-react'

interface SalesPaymentMethodBadgeProps {
  paymentMethod: PaymentMethod
}

export default function SalesPaymentMethodBadge({
  paymentMethod,
}: SalesPaymentMethodBadgeProps) {
  const getSalesPaymentMethodIcon = (
    paymentMethod: SalesPaymentMethodBadgeProps['paymentMethod']
  ) => {
    switch (paymentMethod) {
      case 'cash':
        return <DollarSign className="h-4 w-4 text-green-600" />
      case 'transfer':
        return <CreditCard className="h-4 w-4 text-yellow-600" />
      case 'crypto':
        return <Bitcoin className="h-4 w-4 text-purple-600" />
      default:
        return <DollarSign className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getSalesPaymentMethodText = (
    paymentMethod: SalesPaymentMethodBadgeProps['paymentMethod']
  ) => {
    switch (paymentMethod) {
      case 'cash':
        return 'Efectivo'
      case 'transfer':
        return 'Transferencia'
      case 'crypto':
        return 'Cripto'
      default:
        return 'Desconocido'
    }
  }
  return (
    <Badge
      variant="outline"
      className="text-xs rounded-full flex items-center gap-1 w-fit"
    >
      {getSalesPaymentMethodIcon(paymentMethod)}
      {getSalesPaymentMethodText(paymentMethod)}
    </Badge>
  )
}
