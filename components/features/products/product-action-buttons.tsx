import React, { useState } from 'react'
import { Button } from '@/ui/button'
import {
  Loader2,
  MoreHorizontal,
  Power,
  PowerOff,
  Edit,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/ui/alert-dialog'
import { Product } from '@/lib/types/product'

interface ProductActionButtonsProps {
  product: Product
  className?: string
  onToggleStatus: (id: string) => void
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

function ProductActionButtons({
  product,
  className,
  onToggleStatus,
  onEdit,
  onDelete,
}: ProductActionButtonsProps) {
  const [isPending, setIsPending] = useState(false)

  const toggleStatus = async () => {
    setIsPending(true)
    try {
      await onToggleStatus(product.id)
    } catch (error) {
      console.error('Error toggling product status:', error)
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async () => {
    setIsPending(true)
    try {
      await onDelete(product.id)
    } catch (error) {
      console.error('Error deleting product:', error)
    } finally {
      setIsPending(false)
    }
  }
  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={toggleStatus}>
            {product.status === 'active' ? (
              <PowerOff className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            {product.status === 'active' ? 'Desactivar' : 'Activar'}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit(product)}>
            <Edit className="h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => e.preventDefault()}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. ¿Deseas eliminar &quot;
                  {product.name}&quot;?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={handleDelete}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Eliminar'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default ProductActionButtons
