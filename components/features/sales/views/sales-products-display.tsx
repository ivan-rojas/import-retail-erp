'use client'

import { Badge } from '@/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/tooltip'
import type { SaleDTO } from '@/lib/types/sales'

interface SalesProductsDisplayProps {
  sale: SaleDTO
  variant?: 'list' | 'table'
}

export default function SalesProductsDisplay({
  sale,
  variant = 'list',
}: SalesProductsDisplayProps) {
  const items = sale.sale_items || []
  const primaryItem = items[0]
  const additionalItemsCount = items.length - 1

  if (!primaryItem) {
    return <div className="text-muted-foreground text-sm">Sin productos</div>
  }

  const ProductInfo = () => (
    <div>
      <div
        className={
          variant === 'table' ? 'font-medium' : 'text-sm text-muted-foreground'
        }
      >
        {primaryItem.item_name}
      </div>
      <div className="text-sm text-muted-foreground">
        {primaryItem.item_model}
      </div>
      {primaryItem.product_items?.imei && (
        <div className="text-xs text-muted-foreground">
          IMEI: {primaryItem.product_items?.imei}
        </div>
      )}
      {primaryItem.item_quantity > 1 && (
        <div className="text-xs text-muted-foreground">
          Cantidad: {primaryItem.item_quantity}
        </div>
      )}
    </div>
  )

  if (additionalItemsCount === 0) {
    return <ProductInfo />
  }

  return (
    <div
      className={`flex items-end gap-2 ${
        variant === 'table' ? '' : 'border-b border-border pb-2'
      }`}
    >
      <ProductInfo />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="text-xs cursor-help hover:bg-background"
            >
              +{additionalItemsCount}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs" variant="outline">
            <div className="space-y-2">
              <div className="font-semibold text-xs text-muted-foreground mb-2">
                Todos los productos:
              </div>
              {items.map((item, index) => (
                <div key={item.id} className="text-xs">
                  <div className="font-medium text-foreground">
                    {item.item_name}
                  </div>
                  <div className="text-muted-foreground">{item.item_model}</div>
                  <div className="text-muted-foreground">
                    {item.product_items?.imei}
                  </div>
                  {item.item_quantity > 1 && (
                    <div className="text-muted-foreground">
                      Cant: {item.item_quantity}
                    </div>
                  )}
                  <div className="text-muted-foreground font-semibold">
                    ${item.item_price}
                  </div>
                  {index < items.length - 1 && (
                    <div className="border-b border-border my-1"></div>
                  )}
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
