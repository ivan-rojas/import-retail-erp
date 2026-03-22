'use client'

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import ClientForm from './client-form'
import type { Client } from '@/lib/types/client'

interface AddEditClientProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
}

export default function AddEditClient({
  open,
  onOpenChange,
  client,
}: AddEditClientProps) {
  const handleSuccess = () => {
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {client ? 'Editar Cliente' : 'Agregar Cliente'}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <ClientForm
            client={client}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

