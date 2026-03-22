import { ItemStatus } from '@/lib/enums'
import { Badge } from '@/ui/badge'
import {
  BadgeX,
  Box,
  CheckCircle,
  Clock,
  ShoppingCart,
  Wrench,
} from 'lucide-react'
import React from 'react'

interface InventoryStatusBadgeProps {
  status: ItemStatus
  children?: React.ReactNode
}

function InventoryStatusBadge({ status, children }: InventoryStatusBadgeProps) {
  const getTextBadge = (status: ItemStatus) => {
    switch (status) {
      case 'available':
        return 'Disponible'
      case 'reserved':
        return 'Reservado'
      case 'sold':
        return 'Vendido'
      case 'in-repair':
        return 'En reparación'
      case 'lost':
        return 'Perdido'
      case 'spare':
        return 'Despiece'
      default:
        return 'Disponible'
    }
  }

  const getStatusIcon = (status: ItemStatus) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'reserved':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'sold':
        return <ShoppingCart className="w-4 h-4 text-gray-500" />
      case 'in-repair':
        return <Wrench className="w-4 h-4 text-blue-500" />
      case 'lost':
        return <BadgeX className="w-4 h-4 text-pink-500" />
      case 'spare':
        return <Box className="w-4 h-4 text-purple-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  return (
    <Badge
      variant="outline"
      className="flex items-center gap-1 w-fit rounded-full"
    >
      {getStatusIcon(status)}
      {children || getTextBadge(status)}
    </Badge>
  )
}

export default InventoryStatusBadge
