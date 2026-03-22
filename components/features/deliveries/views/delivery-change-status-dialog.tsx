import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import React from 'react'

interface DeliveryChangeStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deliveryId: string
  status: 'pending' | 'delivered' | 'cancelled'
  onConfirm: () => void
}
function DeliveryChangeStatusDialog({
  open,
  onOpenChange,
  status,
  onConfirm,
}: DeliveryChangeStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar estado de entrega</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <span>
            {status === 'cancelled'
              ? '¿Estás seguro de querer cancelar la entrega?'
              : '¿Estás seguro de querer marcar la entrega como entregada?'}
          </span>
          <br />
          <span className="text-muted-foreground">
            Este proceso es irreversible.
          </span>
        </DialogDescription>
        <DialogFooter>
          <Button
            variant={status === 'cancelled' ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeliveryChangeStatusDialog
