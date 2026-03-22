'use client'

import { useState } from 'react'
import { Input } from '@/ui/input'
import { Button } from '@/ui/button'
import { Label } from '@/ui/label'
import { cn } from '@/lib/utils'

interface PriceOverrideCardProps {
  itemName: string
  suggestedPrice: number
  suggestedWholesalePrice?: number
  costPrice?: number
  onConfirm: (price: number) => void
  confirmLabel?: string
}

type PriceType = 'retail' | 'wholesale' | 'custom'

export default function PriceOverrideCard({
  itemName,
  suggestedPrice,
  suggestedWholesalePrice,
  costPrice,
  onConfirm,
  confirmLabel = 'Agregar',
}: PriceOverrideCardProps) {
  const [priceType, setPriceType] = useState<PriceType>(
    suggestedWholesalePrice !== undefined && suggestedWholesalePrice > 0
      ? 'wholesale'
      : 'retail'
  )
  const [customPrice, setCustomPrice] = useState('')

  // Helper function to parse customPrice consistently
  const parseCustomPrice = (): number => {
    if (!customPrice || customPrice.trim() === '') {
      return 0
    }
    const parsed = parseFloat(customPrice)
    return isNaN(parsed) ? 0 : parsed
  }

  const handleConfirm = () => {
    let finalPrice: number

    switch (priceType) {
      case 'retail':
        finalPrice = suggestedPrice
        break
      case 'wholesale':
        finalPrice = suggestedWholesalePrice ?? suggestedPrice
        break
      case 'custom':
        finalPrice = parseCustomPrice()
        break
      default:
        finalPrice = suggestedPrice
    }

    onConfirm(finalPrice)
    setCustomPrice('')
    setPriceType(suggestedWholesalePrice ? 'wholesale' : 'retail')
  }

  const getDisplayPrice = () => {
    switch (priceType) {
      case 'retail':
        return suggestedPrice
      case 'wholesale':
        return suggestedWholesalePrice ?? suggestedPrice
      case 'custom':
        return parseCustomPrice()
      default:
        return suggestedPrice
    }
  }

  return (
    <div className="mt-2 p-3 rounded-lg border border-border">
      <p className="text-sm font-medium text-foreground mb-3">
        Producto encontrado: {itemName}
      </p>

      <div className="space-y-2 mb-3">
        <Label className="text-xs text-foreground">
          Seleccione tipo de precio:
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Button
            type="button"
            variant={priceType === 'retail' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPriceType('retail')}
            className={cn(
              'w-full min-w-0 min-h-[40px]',
              priceType === 'retail' && 'bg-primary hover:bg-primary/90'
            )}
          >
            <div className="flex flex-col items-start">
              <span className="text-xs font-normal">Minorista</span>
              <span className="text-sm font-semibold">
                ${suggestedPrice.toFixed(2)}
              </span>
            </div>
          </Button>

          {suggestedWholesalePrice !== undefined &&
            suggestedWholesalePrice > 0 && (
              <Button
                type="button"
                variant={priceType === 'wholesale' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriceType('wholesale')}
                className={cn(
                  'w-full min-w-0 min-h-[40px]',
                  priceType === 'wholesale' && 'bg-primary hover:bg-primary/90'
                )}
              >
                <div className="flex flex-col items-start">
                  <span className="text-xs font-normal">Mayorista</span>
                  <span className="text-sm font-semibold">
                    ${suggestedWholesalePrice.toFixed(2)}
                  </span>
                </div>
              </Button>
            )}

          <Button
            type="button"
            variant={priceType === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPriceType('custom')}
            className={cn(
              'w-full min-w-0 min-h-[40px]',
              priceType === 'custom' && 'bg-primary hover:bg-primary/90'
            )}
          >
            <span className="text-sm">Personalizado</span>
          </Button>
        </div>
      </div>

      {priceType === 'custom' && (
        <div className="mb-3">
          <Input
            type="number"
            placeholder="Ingrese precio personalizado"
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
            className="w-full"
            step="0.01"
            min="0"
            autoFocus
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-border">
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-foreground">
            Precio final: ${getDisplayPrice().toFixed(2)}
          </p>
          {typeof costPrice === 'number' && (
            <p className="text-xs text-muted-foreground">
              Costo: ${costPrice.toFixed(2)}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={handleConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  )
}
