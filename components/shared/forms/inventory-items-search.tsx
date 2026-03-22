'use client'

import { useMemo } from 'react'
import { Button } from '@/ui/button'
import { useInventory } from '@/lib/hooks/use-inventory'
import type { InventoryItem } from '@/lib/types/inventory'

interface InventoryItemsSearchProps {
  value: string
  searchValue: string
  onValueChange: (value: string) => void
  onSearchChange: (search: string) => void
  onItemSelect: (item: InventoryItem) => void
  disabled?: boolean
  error?: { message?: string }
  placeholder?: string
  filterType?: 'product' | 'accessory' | 'all'
  excludeUnavailable?: boolean
  includeInRepair?: boolean
  /** When editing a sale: include items from this sale so they can be re-added. */
  saleId?: string | null
}

export default function InventoryItemsSearch({
  value,
  searchValue,
  onValueChange,
  onSearchChange,
  onItemSelect,
  disabled = false,
  error,
  placeholder = 'Buscar ítems del inventario por modelo, color, almacenamiento o IMEI...',
  filterType = 'all',
  excludeUnavailable = false,
  includeInRepair = false,
  saleId,
}: InventoryItemsSearchProps) {
  const { data: inventory = [] as InventoryItem[] } = useInventory(
    excludeUnavailable,
    includeInRepair,
    saleId
  )

  const filtered = useMemo(() => {
    if (!searchValue) return [] as InventoryItem[]
    const q = searchValue.toLowerCase()

    return inventory
      .filter(
        (item) => filterType === 'all' || item.products?.type === filterType
      )
      .filter((item) => {
        const model = item.products?.model?.toLowerCase() || ''
        const name = item.name.toLowerCase()
        const color = item.color.toLowerCase()
        const storage = (item.storage || '').toLowerCase()
        const imei = (item.imei || '').toLowerCase()
        return (
          model.includes(q) ||
          name.includes(q) ||
          color.includes(q) ||
          storage.includes(q) ||
          imei.includes(q)
        )
      })
      .slice(0, 20)
  }, [inventory, searchValue, filterType])

  const selectedItem = useMemo(
    () => inventory.find((i) => i.id === value),
    [inventory, value]
  )

  return (
    <div className="relative">
      <input
        className={`w-full border rounded p-2 ${
          error ? 'border-destructive focus-visible:ring-destructive' : ''
        }`}
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        disabled={disabled || !!value}
      />

      {searchValue && !value && (
        <div className="absolute z-10 mt-1 w-full border rounded max-h-56 overflow-auto bg-background">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-accent"
              onClick={() => onItemSelect(item)}
            >
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                {item.products?.model} {item.storage} {item.color}
                {item.imei ? ` · IMEI: ${item.imei}` : ''} — ${item.price}
              </div>
            </button>
          ))}
        </div>
      )}

      {value && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground break-all">
          <span>
            Seleccionado: {selectedItem?.products?.model}{' '}
            {selectedItem?.storage} {selectedItem?.color}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onValueChange('')
              onSearchChange('')
            }}
          >
            Cambiar
          </Button>
        </div>
      )}
    </div>
  )
}
