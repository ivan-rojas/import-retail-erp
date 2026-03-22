import { InventoryRow } from '@/lib/types/inventory'
import { Package } from 'lucide-react'

function InventoryNoProducts({ allProducts }: { allProducts: InventoryRow[] }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
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

export default InventoryNoProducts
