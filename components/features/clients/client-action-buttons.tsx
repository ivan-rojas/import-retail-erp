'use client'

import { useState } from 'react'
import { Button } from '@/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/alert-dialog'
import { Edit, Trash2, MoreHorizontal, DollarSign } from 'lucide-react'
import { useDeleteClient } from '@/lib/hooks/use-clients'
import type { Client } from '@/lib/types/client'
import ClientBalanceDetails from './client-balance-details'

interface ClientActionButtonsProps {
  client: Client
  onEdit: (client: Client) => void
  disabled?: boolean
}

export default function ClientActionButtons({
  client,
  onEdit,
  disabled = false,
}: ClientActionButtonsProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [balanceDetailsOpen, setBalanceDetailsOpen] = useState(false)
  const deleteClient = useDeleteClient()

  const handleDelete = () => {
    deleteClient.mutate(client.id, {
      onSuccess: () => {
        setConfirmDeleteOpen(false)
      },
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={disabled}
          >
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setBalanceDetailsOpen(true)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Ver Balance
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(client)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Balance Details Modal */}
      <ClientBalanceDetails
        client={client}
        open={balanceDetailsOpen}
        onOpenChange={setBalanceDetailsOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar al cliente &quot;
              {client.customer_name}&quot;? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteClient.isPending}
            >
              {deleteClient.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
