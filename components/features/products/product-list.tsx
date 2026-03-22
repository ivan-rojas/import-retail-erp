import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Badge } from '@/ui/badge'
import React from 'react'
import { Product } from '@/lib/types/product'
import { useDeleteProduct, useUpdateProduct } from '@/lib/hooks/use-products'
import { TooltipProvider } from '@/ui/tooltip'
import NoProducts from './no-products'
import ProductActionButtons from './product-action-buttons'
import { renderCategoryIcon } from '@/lib/utils/category-icons'

interface ProductListProps {
  products: Product[] // These are the filtered products to display
  allProducts: Product[] // All products (needed for toggleStatus)
  setEditingProduct: (product: Product) => void
}

export default function ProductList({
  products,
  allProducts,
  setEditingProduct,
}: ProductListProps) {
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
      await updateProduct.mutateAsync({
        id,
        data: {
          status: product.status === 'active' ? 'inactive' : 'active',
        },
      })
    }
  }

  if (products.length === 0) {
    return <NoProducts allProducts={allProducts} />
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Lista de Productos</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {renderCategoryIcon(product.category_icon ?? product.category)}
                        <h3 className="font-semibold">{product.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {product.type === 'product'
                            ? 'Producto'
                            : 'Accesorio'}
                        </Badge>
                        <Badge
                          className={
                            product.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {product.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {product.model} • {product.category}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2 items-center">
                        <span className="text-xs">Colores:</span>
                        {product.available_colors
                          .slice(0, 4)
                          .map((color, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {color}
                            </Badge>
                          ))}
                        {product.available_colors.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{product.available_colors.length - 4} más
                          </Badge>
                        )}
                      </div>
                      {product.available_storage &&
                        product.available_storage.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 items-center">
                            <span className="text-xs">Capacidades:</span>
                            {product.available_storage
                              .slice(0, 4)
                              .map((storage, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {storage}
                                </Badge>
                              ))}
                            {product.available_storage.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{product.available_storage.length - 4} más
                              </Badge>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between items-end gap-8">
                  <ProductActionButtons
                    product={product}
                    onToggleStatus={toggleStatus}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    className="flex items-center"
                  />
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ${product.base_price}
                    </div>
                    <div className="text-sm">Precio base</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
