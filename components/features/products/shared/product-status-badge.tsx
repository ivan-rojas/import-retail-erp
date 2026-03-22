import { Badge } from '@/ui/badge'
import { CircleCheck, CircleX, Trash } from 'lucide-react'
import React from 'react'

interface ProductStatusBadgeProps {
  status: 'active' | 'inactive' | 'deleted'
}

export default function ProductStatusBadge({
  status,
}: ProductStatusBadgeProps) {
  const getStatusIcon = (status: 'active' | 'inactive' | 'deleted') => {
    switch (status) {
      case 'active':
        return <CircleCheck className="h-4 w-4 text-green-500" />
      case 'inactive':
        return <CircleX className="h-4 w-4 text-red-500" />
      case 'deleted':
        return <Trash className="h-4 w-4 text-red-500" />
      default:
        return <CircleCheck className="h-4 w-4 text-green-500" />
    }
  }
  const getStatusText = (status: 'active' | 'inactive' | 'deleted') => {
    switch (status) {
      case 'active':
        return 'Activo'
      case 'inactive':
        return 'Inactivo'
      case 'deleted':
        return 'Eliminado'
      default:
        return 'Activo'
    }
  }
  return (
    <Badge
      variant="outline"
      className="text-xs rounded-full flex items-center gap-1"
    >
      {getStatusIcon(status)} {getStatusText(status)}
    </Badge>
  )
}
