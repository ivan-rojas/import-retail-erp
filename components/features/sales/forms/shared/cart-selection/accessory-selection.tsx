'use client'

import { useState } from 'react'
import PriceOverrideCard from './price-override-card'
import type { UseSaleSelectionApi } from './use-sale-selection'
import { Input } from '@/ui/input'
import InventoryItemsSearch from '@/components/shared/forms/inventory-items-search'
import type { InventoryItem } from '@/lib/types/inventory'
import { Search } from 'lucide-react'

interface AccessorySelectionProps {
  selection: UseSaleSelectionApi
  includeInRepair?: boolean
}

export default function AccessorySelection({
  selection,
  includeInRepair = false,
}: AccessorySelectionProps) {
  const { addProductToSelection } = selection

  const [selectedItemId, setSelectedItemId] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [selectedQty, setSelectedQty] = useState(1)

  const handleItemSelect = (item: InventoryItem) => {
    setSelectedItemId(item.id)
    setSelectedItem(item)
    setSearchValue('')
    setSelectedQty(1)
  }

  const handleValueChange = (value: string) => {
    // InventoryItemsSearch only calls onValueChange with empty string to clear selection
    setSelectedItemId('')
    setSelectedItem(null)
    setSelectedQty(1)
  }

  const handleClearSelection = () => {
    setSelectedItemId('')
    setSelectedItem(null)
    setSearchValue('')
    setSelectedQty(1)
  }

  return (
    <div className="p-3 rounded-lg border">
      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
        <Search className="h-4 w-4" /> Agregar accesorio desde inventario
      </div>
      <InventoryItemsSearch
        value={selectedItemId}
        searchValue={searchValue}
        onValueChange={handleValueChange}
        onSearchChange={setSearchValue}
        onItemSelect={handleItemSelect}
        filterType="accessory"
        excludeUnavailable={true}
        includeInRepair={includeInRepair}
        placeholder="Escribe modelo, color, almacenamiento..."
      />

      {selectedItem && (
        <div className="mt-3">
          <label
            htmlFor="qty"
            className="text-sm font-medium text-foreground mb-2 block"
          >
            Cantidad *
          </label>
          <Input
            id="qty"
            type="number"
            min="1"
            step="1"
            value={selectedQty}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10)
              if (!isNaN(value) && value > 0) {
                setSelectedQty(value)
              }
            }}
            disabled={!selectedItem}
          />
        </div>
      )}

      {selectedItem && selectedItem.quantity >= selectedQty && (
        <PriceOverrideCard
          itemName={selectedItem.name}
          suggestedPrice={selectedItem.price}
          suggestedWholesalePrice={selectedItem.wholesale_price}
          costPrice={selectedItem.cost}
          onConfirm={(price) => {
            addProductToSelection(selectedItem, price, selectedQty)
            handleClearSelection()
          }}
          confirmLabel="Agregar al Carrito"
        />
      )}
    </div>
  )
}
