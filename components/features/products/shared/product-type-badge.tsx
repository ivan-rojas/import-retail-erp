import { Badge } from '@/ui/badge'
import { renderCategoryIcon } from '@/lib/utils/category-icons'
import React from 'react'

interface ProductTypeBadgeProps {
  type: 'product' | 'accessory'
  category?: string
  categoryIcon?: string | null
}

export default function ProductTypeBadge({
  type,
  category,
  categoryIcon,
}: ProductTypeBadgeProps) {
  const getTextBadge = (type: string) => {
    switch (type) {
      case 'product':
        return 'Producto'
      case 'accessory':
        return 'Accesorio'
      default:
        return 'Producto'
    }
  }
  return (
    <Badge
      variant="outline"
      className="text-xs rounded-full flex items-center gap-1"
    >
      {renderCategoryIcon(categoryIcon ?? category)} {getTextBadge(type)}
    </Badge>
  )
}
