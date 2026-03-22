import { DeliveryDTO } from '@/lib/types/delivery'
import { Button } from '@/ui/button'
import { DropdownMenuItem } from '@/ui/dropdown-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu'
import { format } from 'date-fns'
import { CheckCircle, Clock, MoreHorizontal, XCircle } from 'lucide-react'
import { useState } from 'react'
import DeliveryChangeStatusDialog from './delivery-change-status-dialog'
import { useUpdateDeliveryStatus } from '@/lib/hooks/use-deliveries'

export default function DeliveryCard({ delivery }: { delivery: DeliveryDTO }) {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDeliveredDialog, setShowDeliveredDialog] = useState(false)

  const updateDeliveryStatus = useUpdateDeliveryStatus()

  const handleCancelDelivery = () => {
    updateDeliveryStatus.mutate({
      deliveryId: delivery.id,
      status: 'cancelled',
    })
    setShowCancelDialog(false)
  }

  const handleDeliveredDelivery = () => {
    updateDeliveryStatus.mutate({
      deliveryId: delivery.id,
      status: 'delivered',
    })
    setShowDeliveredDialog(false)
  }
  return (
    <div
      key={delivery.id}
      className={`bg-card border border-border relative rounded-md p-3 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full flex justify-between`}
    >
      <div>
        <div className="font-medium flex items-center gap-2 mb-1">
          {getDeliveryStatusIcon(delivery)}
          <span>{getDeliveryStatus(delivery)}</span>
          <div className="text-muted-foreground">
            {format(new Date(delivery.delivery_date), 'HH:mm')}
          </div>
        </div>

        {delivery.sale && (
          <>
            <div className="font-medium text-sm mb-1">
              {delivery.sale.customer_name}
            </div>

            {delivery.sale.sale_items &&
              delivery.sale.sale_items.length > 0 && (
                <div className="text-muted-foreground text-xs space-y-1">
                  {delivery.sale.sale_items.map((item, index) => (
                    <div key={index} className="truncate">
                      {item.item_quantity}x {item.item_name}
                    </div>
                  ))}
                </div>
              )}
          </>
        )}

        <div className="text-muted-foreground text-xs mt-1">
          {delivery.delivery_notes}
        </div>
      </div>
      {delivery.delivery_status === 'pending' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="bg-background rounded-md"
          >
            <DropdownMenuItem
              onClick={() => setShowDeliveredDialog(true)}
              className="text-green-600 focus:text-green-600 focus:bg-green-600/10"
            >
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
              Entregar
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {showCancelDialog && (
        <DeliveryChangeStatusDialog
          open={showCancelDialog}
          onOpenChange={() => setShowCancelDialog(false)}
          deliveryId={delivery.id}
          status="cancelled"
          onConfirm={handleCancelDelivery}
        />
      )}
      {showDeliveredDialog && (
        <DeliveryChangeStatusDialog
          open={showDeliveredDialog}
          onOpenChange={() => setShowDeliveredDialog(false)}
          deliveryId={delivery.id}
          status="delivered"
          onConfirm={handleDeliveredDelivery}
        />
      )}
    </div>
  )
}

const getDeliveryStatusIcon = (delivery: DeliveryDTO) => {
  if (delivery.delivery_status === 'delivered') {
    return <CheckCircle className="h-4 w-4 text-green-600" />
  } else if (delivery.delivery_status === 'cancelled') {
    return <XCircle className="h-4 w-4 text-red-600" />
  } else {
    return <Clock className="h-4 w-4 text-yellow-600" />
  }
}

const getDeliveryStatus = (delivery: DeliveryDTO) => {
  if (delivery.delivery_status === 'delivered') {
    return 'Entregada'
  } else if (delivery.delivery_status === 'cancelled') {
    return 'Cancelada'
  } else {
    return 'Pendiente'
  }
}
