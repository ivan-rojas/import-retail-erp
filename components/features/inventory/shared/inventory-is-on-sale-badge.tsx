import { Badge } from '@/ui/badge'
import { cn } from '@/lib/utils'
import React from 'react'
import { Percent } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

interface InventoryIsOnSaleBadgeProps {
  isOnSale: boolean | undefined
  onlyIcon?: boolean
}

function InventoryIsOnSaleBadge({
  isOnSale,
  onlyIcon = false,
}: InventoryIsOnSaleBadgeProps) {
  if (!isOnSale) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            'flex items-center gap-1 w-fit rounded-full text-xs',
            'bg-red-50 text-red-600 border-red-200',
            'dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30'
          )}
        >
          <Percent className="w-4 h-4" />
          {!onlyIcon ? 'En Oferta' : <span className="sr-only">En Oferta</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent variant="destructive">
        <p>En Oferta</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default InventoryIsOnSaleBadge
