'use client'

import { Badge } from '@/ui/badge'
import InventoryActionButtons from './inventory-action-buttons'
import { AlertCircle, Wrench } from 'lucide-react'
import type { InventoryRow } from '@/lib/types/inventory'
import InventoryNoProducts from './inventory-no-products'
import InventoryConditionBadge from '../shared/inventory-condition-badge'
import InventoryStatusBadge from '../shared/inventory-status-badge'
import InventoryTypeBadge from '../shared/inventory-type-badge'
import { ItemStatus } from '@/lib/enums'

export default function InventoryList({
  data,
  hideActions = false,
}: {
  data: InventoryRow[]
  hideActions?: boolean
}) {
  if (!data.length) {
    return <InventoryNoProducts allProducts={data} />
  }

  return (
    <div className="space-y-3">
      {data.map((row) => (
        <div
          key={`${row.table}-${row.id}`}
          className="flex flex-col gap-4 p-4 border rounded-lg sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="space-y-1 min-w-0">
              <div className="font-medium flex flex-wrap items-center gap-2 min-w-0">
                <InventoryTypeBadge
                  type={row.products?.type ?? 'product'}
                  onlyIcon
                />
                <span className="min-w-0 break-words">
                  {row.products?.model || row.name}
                </span>
              </div>
              <div className="text-sm text-muted-foreground break-all">
                {row.imei ? row.imei : ''}
              </div>
              <div className="text-sm text-muted-foreground break-words">
                {row.storage ? `${row.storage} · ` : ''}
                {row.color}
              </div>
              {'quantity' in row && row.products?.type === 'accessory' ? (
                <div className="text-sm">
                  Cant: <span className="font-semibold">{row.quantity}</span>
                </div>
              ) : null}
              {'technician' in row && row.status === 'in-repair' && (
                <Badge
                  variant="outline"
                  className="text-xs flex items-center gap-1 w-fit rounded-full"
                >
                  <Wrench className="w-3 h-3" />
                  {row.technician}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 flex flex-col items-start sm:items-end">
            <div className="flex items-center gap-2">
              {row.status ? (
                row.table === 'accessory_items' && row.quantity === 0 ? (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 w-fit rounded-full"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    Sin Stock
                  </Badge>
                ) : (
                  <InventoryStatusBadge status={row.status as ItemStatus} />
                )
              ) : null}
              <InventoryConditionBadge condition={row.condition || 'new'} />
              {!hideActions && <InventoryActionButtons row={row} />}
            </div>
            {'cost' in row && displayPrice(row.cost as number, 'Costo')}
          </div>
        </div>
      ))}
    </div>
  )
}

function displayPrice(price: number | undefined, label: string) {
  if (!price) price = 0
  return (
    <div className="font-semibold text-base sm:text-lg">
      <span className="text-muted-foreground text-sm">{label}:</span> $
      {price.toFixed(2)}
    </div>
  )
}
