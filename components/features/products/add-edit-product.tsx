import { useState, useEffect } from 'react'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog'
import { ProductForm } from '@/components/features/products/product-form'
import { Plus } from 'lucide-react'
import { Product } from '@/lib/types/product'
import { useCreateProduct, useUpdateProduct } from '@/lib/hooks/use-products'

export default function AddEditProduct({
  editingProduct,
  onProductChange,
}: {
  editingProduct?: Product | null
  onProductChange?: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  // Handle external edit requests
  useEffect(() => {
    if (editingProduct) {
      setIsOpen(true)
    }
  }, [editingProduct])

  const handleSave = async (productData: {
    name: string
    type: 'product' | 'accessory'
    category_id: string
    model: string
    available_colors: string[]
    available_storage?: string[]
    base_price: number
    wholesale_price: number
    description: string
    specifications: Record<string, string>
    status: 'active' | 'inactive' | 'deleted'
  }) => {
    if (editingProduct) {
      await updateProduct.mutateAsync({
        id: editingProduct.id,
        data: productData,
      })
    } else {
      await createProduct.mutateAsync(productData)
    }

    // Close dialog and notify parent
    setIsOpen(false)
    onProductChange?.()
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Notify parent to clear its editing state
      onProductChange?.()
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Define las características y especificaciones del producto
          </p>
        </DialogHeader>
        <DialogBody>
          <ProductForm
            editingProduct={editingProduct}
            onSubmit={handleSave}
            isLoading={createProduct.isPending || updateProduct.isPending}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
