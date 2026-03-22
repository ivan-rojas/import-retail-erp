import { useState } from 'react'
import type { InventoryItem } from '@/lib/types/inventory'
import { Search } from 'lucide-react'
import InventoryItemsSearch from '@/components/shared/forms/inventory-items-search'
import PriceOverrideCard from './price-override-card'

export default function ProductFeatureSelection({
  onAdd,
  includeInRepair = false,
  saleId,
}: {
  onAdd: (item: InventoryItem, customPrice?: number) => void
  includeInRepair?: boolean
  /** When editing a sale: include items from this sale so they can be re-added. */
  saleId?: string | null
}) {
  const [searchValue, setSearchValue] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  return (
    <div className="p-3 rounded-lg border">
      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
        <Search className="h-4 w-4" /> Agregar producto desde inventario
      </div>
      <InventoryItemsSearch
        value={selectedId}
        searchValue={searchValue}
        onValueChange={(v) => {
          setSelectedId(v)
          if (!v) setSelectedItem(null)
        }}
        onSearchChange={(v) => setSearchValue(v)}
        onItemSelect={(item) => {
          setSelectedItem(item)
          setSelectedId(item.id)
        }}
        placeholder="Escribe modelo, color, almacenamiento..."
        filterType="product"
        excludeUnavailable={true}
        includeInRepair={includeInRepair}
        saleId={saleId}
      />

      {selectedItem && (
        <PriceOverrideCard
          itemName={selectedItem.name}
          suggestedPrice={selectedItem.price}
          suggestedWholesalePrice={selectedItem.wholesale_price}
          costPrice={selectedItem.cost}
          onConfirm={(price) => {
            onAdd(selectedItem, price)
            setSelectedItem(null)
            setSearchValue('')
            setSelectedId('')
          }}
          confirmLabel="Agregar al Carrito"
        />
      )}
    </div>
  )
}
