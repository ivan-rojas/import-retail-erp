import { ItemType } from '@/lib/enums'
import { Badge } from '@/ui/badge'
import { Cable, Smartphone } from 'lucide-react'
import React from 'react'

interface InventoryTypeBadgeProps {
  type: ItemType
  onlyIcon?: boolean
}

function InventoryTypeBadge({
  type,
  onlyIcon = false,
}: InventoryTypeBadgeProps) {
  const getInventoryTypeIcon = (type: ItemType) => {
    switch (type) {
      case 'product':
        return <Smartphone className="w-4 h-4" />
      case 'accessory':
        return <Cable className="w-4 h-4" />
      default:
        return <Smartphone className="w-4 h-4" />
    }
  }

  const getTextBadge = (type: ItemType) => {
    switch (type) {
      case 'product':
        return 'Dispositivo'
      case 'accessory':
        return 'Accesorio'
      default:
        return 'Dispositivo'
    }
  }
  return (
    <Badge
      variant="outline"
      className="flex items-center gap-1 w-fit rounded-full"
    >
      {getInventoryTypeIcon(type)}
      {!onlyIcon && getTextBadge(type)}
    </Badge>
  )
}

export default InventoryTypeBadge
