import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/ui/card'
import { Badge } from '@/ui/badge'
import React from 'react'
import { Product } from '@/lib/types/product'
import { useDeleteProduct, useUpdateProduct } from '@/lib/hooks/use-products'
import NoProducts from './no-products'
import ProductActionButtons from './product-action-buttons'
import ProductStatusBadge from './shared/product-status-badge'
import ProductTypeBadge from './shared/product-type-badge'

interface ProductsGridProps {
  products: Product[] // These are the filtered products to display
  allProducts: Product[] // All products (needed for toggleStatus)
  setEditingProduct: (product: Product) => void
}

export default function ProductsGrid({
  products,
  allProducts,
  setEditingProduct,
}: ProductsGridProps) {
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
  }

  const handleDelete = async (id: string) => {
    await deleteProduct.mutateAsync(id)
  }

  const toggleStatus = async (id: string) => {
    const product = allProducts.find((p) => p.id === id)
    if (product) {
      try {
        await updateProduct.mutateAsync({
          id,
          data: { status: product.status === 'active' ? 'inactive' : 'active' },
        })
      } catch (error: unknown) {
        console.error('Error toggling product status:', error)
      }
    }
  }

  if (products.length === 0) {
    return <NoProducts allProducts={allProducts} />
  }

  return (
    <>
      {products.map((product) => (
        <Card
          key={product.id}
          className="hover:shadow-md transition-shadow flex justify-between"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ProductTypeBadge
                  type={product.type}
                  category={product.category}
                  categoryIcon={product.category_icon}
                />
              </div>
              <div className="flex items-center gap-2">
                <ProductStatusBadge status={product.status} />
                <ProductActionButtons
                  product={product}
                  onToggleStatus={toggleStatus}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  className="flex gap-1"
                />
              </div>
            </div>
            <CardTitle className="text-lg">{product.name}</CardTitle>
            <p className="text-sm">{product.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div>
                <span className="text-xs">Colores disponibles:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {product.available_colors.map((color, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
              {product.available_storage && (
                <div>
                  <span className="text-xs">Capacidades:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.available_storage.map((storage, index) => (
                      <Badge key={index} className="text-xs">
                        {storage}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end items-end gap-2">
            <span className="text-muted-foreground text-sm mb-1">
              Precio Base:
            </span>
            <span className="font-bold text-lg">${product.base_price}</span>
          </CardFooter>
        </Card>
      ))}
    </>
  )
}
