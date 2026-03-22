'use client'

import { useMemo } from 'react'
import { Button } from '@/ui/button'
import { FormControl, FormMessage } from '@/ui/form'
import { useProducts, useProductById } from '@/lib/hooks/use-products'
import { Product } from '@/lib/types/product'

interface ProductsSearchProps {
  value: string
  searchValue: string
  onValueChange: (value: string) => void
  onSearchChange: (search: string) => void
  onProductSelect: (product: Product) => void
  disabled?: boolean
  error?: { message?: string }
  placeholder?: string
  filterType?: 'product' | 'accessory'
}

export default function ProductsSearch({
  value,
  searchValue,
  onValueChange,
  onSearchChange,
  onProductSelect,
  disabled = false,
  error,
  placeholder = 'Buscar productos...',
  filterType = 'product',
}: ProductsSearchProps) {
  const { data: products = [] } = useProducts()

  const filteredProducts = useMemo(() => {
    if (!searchValue) return []

    return products
      .filter((p) => p.type === filterType)
      .filter((p) => {
        const q = searchValue.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) || p.model.toLowerCase().includes(q)
        )
      })
      .slice(0, 40)
  }, [products, searchValue, filterType])

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === value),
    [products, value]
  )
  const { data: productById } = useProductById(value)
  const selectedName = selectedProduct?.name || productById?.name || value

  return (
    <div className="relative">
      <FormControl>
        <input
          className={`w-full border rounded p-2 ${
            error ? 'border-destructive focus-visible:ring-destructive' : ''
          }`}
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={disabled || !!value}
        />
      </FormControl>

      {searchValue && !value && !disabled && (
        <div className="absolute z-10 mt-1 w-full border rounded max-h-56 overflow-auto bg-background">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-accent"
              onClick={() => onProductSelect(p)}
            >
              <div className="font-medium">{p.name}</div>
            </button>
          ))}
        </div>
      )}

      {value && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground break-all">
          <span>Seleccionado: {selectedName}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onValueChange('')
              onSearchChange('')
            }}
            disabled={disabled}
          >
            Cambiar
          </Button>
        </div>
      )}

      <FormMessage />
    </div>
  )
}
