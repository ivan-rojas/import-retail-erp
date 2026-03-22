import { ItemCondition } from '@/lib/enums'
import { cn } from '@/lib/utils'
import { Badge } from '@/ui/badge'
import React from 'react'

interface InventoryConditionBadgeProps {
  condition: ItemCondition | string
  children?: React.ReactNode
}

function InventoryConditionBadge({
  condition,
  children,
}: InventoryConditionBadgeProps) {
  const getConditionStyles = (condition: ItemCondition | string) => {
    switch (condition) {
      case 'new':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/30'
      case 'used':
        return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/30'
      default:
        return ''
    }
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1 w-fit rounded-full text-xs',
        getConditionStyles(condition)
      )}
    >
      {children ||
        (condition === 'new'
          ? 'Nuevo'
          : condition === 'used'
          ? 'Usado'
          : condition)}
    </Badge>
  )
}

export default InventoryConditionBadge
