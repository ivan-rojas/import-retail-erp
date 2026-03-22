'use client'

import { Button } from '@/ui/button'
import type { InventoryItem } from '@/lib/types/inventory'

interface IMEISearchProps {
  value: string
  searchValue: string
  onValueChange: (value: string) => void
  onSearchChange: (search: string) => void
  onDeviceSelect?: (device: InventoryItem, customPrice?: number) => void
  disabled?: boolean
  error?: { message?: string }
  placeholder?: string
  foundDevice?: InventoryItem | null
  isLoading?: boolean
  showNotFound?: boolean
}

export default function IMEISearch({
  value,
  searchValue,
  onValueChange,
  onSearchChange,
  disabled = false,
  error,
  placeholder = 'Buscar por IMEI...',
  foundDevice,
  isLoading = false,
  showNotFound = false,
}: IMEISearchProps) {
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
        maxLength={16}
      />

      {/* Show not found message */}
      {showNotFound && !foundDevice && !isLoading && (
        <div className="mt-2 p-3 bg-destructive rounded-lg border border-destructive/20">
          <p className="text-sm font-medium text-destructive-foreground">
            No se encontró ningún dispositivo con este IMEI
          </p>
        </div>
      )}

      {/* Show selected device */}
      {value && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground break-all">
          <span>IMEI seleccionado: {value}</span>
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

      {error && (
        <p className="mt-1 text-sm text-destructive-foreground">
          {error.message}
        </p>
      )}
    </div>
  )
}
