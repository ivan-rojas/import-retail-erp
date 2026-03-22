import { Product } from '@/lib/types/product'
import { Package } from 'lucide-react'

export default function NoProducts({
  allProducts,
}: {
  allProducts: Product[]
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12">
      <Package className="h-12 w-12 mb-4" />
      <h3 className="text-lg font-medium mb-2">No se encontraron productos</h3>
      <p className="text-sm">
        {allProducts.length === 0
          ? 'No hay productos registrados aún.'
          : 'Intenta ajustar los filtros de búsqueda.'}
      </p>
    </div>
  )
}
