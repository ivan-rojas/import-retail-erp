'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit, Trash2, Eye, Check, Loader2 } from 'lucide-react'
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
import { Button } from '@/ui/button'
import type { SaleDTO } from '@/lib/types/sales'
import { useDeleteSale } from '@/lib/hooks/use-sales'
import SalesForm from '../forms/sales-form'
import CompleteSalesForm from '../forms/complete-sales-form'

interface SalesActionsMenuProps {
  sale: SaleDTO
}

export default function SalesActionsMenu({ sale }: SalesActionsMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)

  const [disableEdit, setDisableEdit] = useState(false)

  const deleteSale = useDeleteSale()

  const isReservation = sale.status === 'reserved'
  const isDeleted = sale.status === 'deleted'

  const handleDelete = async () => {
    try {
      // For sales, delete the sale record
      await deleteSale.mutateAsync(sale.id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const handleEditView = (disableEdit: boolean) => {
    setDisableEdit(disableEdit)
    setShowEditDialog(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={isDeleted}
          >
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleEditView(true)}
            disabled={isDeleted}
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleEditView(false)}
            disabled={isDeleted}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          {isReservation && !isDeleted && (
            <DropdownMenuItem onClick={() => setShowCompleteDialog(true)}>
              <Check className="mr-2 h-4 w-4" />
              Completar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleted}
          >
            <Trash2 className="mr-2 h-4 w-4 text-red-600" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar {isReservation ? 'reserva' : 'venta'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la{' '}
              {isReservation ? 'reserva' : 'venta'} de{' '}
              <strong>{sale.customer_name}</strong> y todos los datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                disabled={deleteSale.isPending}
                onClick={handleDelete}
              >
                {deleteSale.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Eliminar'
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      {showEditDialog && (
        <SalesForm
          open={showEditDialog}
          onOpenChange={() => setShowEditDialog(false)}
          showTrigger={false}
          saleId={sale.id}
          isReservation={isReservation}
          disabled={disableEdit}
        />
      )}

      {/* Complete Dialog */}
      {showCompleteDialog && (
        <CompleteSalesForm
          open={showCompleteDialog}
          onOpenChange={() => setShowCompleteDialog(false)}
          saleId={sale.id}
        />
      )}
    </>
  )
}
