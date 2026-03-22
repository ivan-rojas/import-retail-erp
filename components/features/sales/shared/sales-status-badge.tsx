import { CheckCircle, Clock, ShoppingCart, Trash, XCircle } from 'lucide-react'
import { Badge } from '@/ui/badge'

interface SalesStatusBadgeProps {
  status: 'sold' | 'reserved' | 'cancelled' | 'deleted'
}

export default function SalesStatusBadge({ status }: SalesStatusBadgeProps) {
  const getSalesStatusIcon = (status: SalesStatusBadgeProps['status']) => {
    switch (status) {
      case 'sold':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'reserved':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'deleted':
        return <Trash className="h-4 w-4 text-red-600" />
      default:
        return <ShoppingCart className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getSalesStatusText = (status: SalesStatusBadgeProps['status']) => {
    switch (status) {
      case 'sold':
        return 'Vendido'
      case 'reserved':
        return 'Reservado'
      case 'cancelled':
        return 'Cancelado'
      case 'deleted':
        return 'Eliminado'
      default:
        return 'Pendiente'
    }
  }

  return (
    <Badge
      variant="outline"
      className="text-xs rounded-full flex items-center gap-1 w-fit"
    >
      {getSalesStatusIcon(status)}
      {getSalesStatusText(status)}
    </Badge>
  )
}
