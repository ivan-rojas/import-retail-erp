'use client'

import { useState } from 'react'
import IMEISearch from '@/components/shared/forms/imei-search'
import { Label } from '@/ui/label'
import type { InventoryItem } from '@/lib/types/inventory'
import { useFindProductItemByIMEI } from '@/lib/hooks/use-inventory'
import PriceOverrideCard from '@/components/features/sales/forms/shared/cart-selection/price-override-card'

export default function ProductIMEISelection({
  onAdd,
  includeInRepair = false,
  /** When editing a sale, pass its ID so the same device can be re-added after removal. */
  saleId,
}: {
  onAdd: (device: InventoryItem, customPrice?: number) => void
  includeInRepair?: boolean
  saleId?: string | null
}) {
  const [imeiSearchValue, setImeiSearchValue] = useState('')
  const [imeiSelectedValue, setImeiSelectedValue] = useState('')
  const shouldFetch =
    imeiSearchValue.length >= 14 && imeiSearchValue.length <= 16
  const {
    data: deviceByIMEI,
    isLoading,
    error,
  } = useFindProductItemByIMEI(
    shouldFetch ? imeiSearchValue : '',
    true, // excludeUnavailable
    includeInRepair,
    saleId
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="imei-input">IMEI del Dispositivo *</Label>
        <IMEISearch
          value={imeiSelectedValue}
          searchValue={imeiSearchValue}
          onValueChange={(value) => setImeiSelectedValue(value)}
          onSearchChange={(search) => setImeiSearchValue(search)}
          placeholder="Escribir o pegar IMEI (14-16 dígitos)"
          foundDevice={deviceByIMEI || null}
          isLoading={isLoading}
          showNotFound={shouldFetch && !!error}
        />
        <p className="text-xs text-muted-foreground">
          Ingresa el IMEI completo de 14 a 16 dígitos del dispositivo
        </p>

        {shouldFetch && isLoading && (
          <p className="text-sm text-muted-foreground">
            Buscando dispositivo...
          </p>
        )}

        {shouldFetch && deviceByIMEI && (
          <PriceOverrideCard
            itemName={deviceByIMEI.name}
            suggestedPrice={deviceByIMEI.price}
            suggestedWholesalePrice={deviceByIMEI.wholesale_price}
            costPrice={deviceByIMEI.cost}
            confirmLabel="Agregar al Carrito"
            onConfirm={(price) => {
              onAdd(deviceByIMEI, price)
              setImeiSearchValue('')
              setImeiSelectedValue('')
            }}
          />
        )}
      </div>
    </div>
  )
}
