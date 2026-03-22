'use client'

import { useState } from 'react'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Badge } from '@/ui/badge'
import { Plus, X } from 'lucide-react'

export interface FixCost {
  fix: string
  cost: string
}

interface FixCostListProps {
  value: FixCost[]
  onChange: (items: FixCost[]) => void
  disabled?: boolean
  error?: string
  label?: string
  fixPlaceholder?: string
  costPlaceholder?: string
}

export default function FixCostList({
  value,
  onChange,
  disabled = false,
  error,
  label = 'Arreglos',
  fixPlaceholder = 'Ej: Pantalla',
  costPlaceholder = 'Costo',
}: FixCostListProps) {
  const [currentFix, setCurrentFix] = useState('')
  const [currentCost, setCurrentCost] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)

  const handleAdd = () => {
    setInputError(null)

    const trimmedFix = currentFix.trim()
    const trimmedCost = currentCost.trim()

    if (!trimmedFix) {
      setInputError('Ingresa el nombre del arreglo')
      return
    }

    if (!trimmedCost) {
      setInputError('Ingresa el costo del arreglo')
      return
    }

    // Check if fix already exists
    if (value.some((item) => (item.fix ?? '').toLowerCase() === trimmedFix.toLowerCase())) {
      setInputError('Este arreglo ya fue agregado')
      return
    }

    // Validate cost is a valid number
    const costNum = parseFloat(trimmedCost)
    if (isNaN(costNum) || costNum < 0) {
      setInputError('El costo debe ser un número válido')
      return
    }

    onChange([...value, { fix: trimmedFix, cost: trimmedCost }])
    setCurrentFix('')
    setCurrentCost('')
  }

  const handleRemove = (toRemove: FixCost) => {
    onChange(value.filter((item) => item !== toRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleFixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentFix(e.target.value)
    if (inputError) setInputError(null)
  }

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentCost(e.target.value)
    if (inputError) setInputError(null)
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      <div className="flex gap-2">
        <Input
          value={currentFix}
          onChange={handleFixChange}
          onKeyDown={handleKeyPress}
          placeholder={fixPlaceholder}
          disabled={disabled}
          className={`flex-1 ${inputError ? 'border-destructive' : ''}`}
        />
        <Input
          value={currentCost}
          onChange={handleCostChange}
          onKeyDown={handleKeyPress}
          placeholder={costPlaceholder}
          disabled={disabled}
          type="number"
          step="0.01"
          min="0"
          className={`w-32 ${inputError ? 'border-destructive' : ''}`}
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={
            disabled ||
            !currentFix.trim() ||
            !currentCost.trim() ||
            value.some(
              (item) =>
                (item.fix ?? '').toLowerCase() === currentFix.trim().toLowerCase()
            )
          }
          size="sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {inputError && <p className="text-sm text-destructive">{inputError}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {label} agregados ({value.length}):
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {value.map((item, index) => {
              const fixLabel = item.fix != null ? String(item.fix) : ''
              return (
              <Badge
                key={`${fixLabel}-${index}`}
                variant="secondary"
                className="flex items-center gap-2 px-2 py-1"
              >
                <span className="text-xs">
                  {fixLabel.length > 30 ? `${fixLabel.slice(0, 30)}...` : fixLabel}
                </span>
                <span className="text-xs font-semibold">
                  ${item.cost ?? ''}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemove(item)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
            })}
          </div>
        </div>
      )}
    </div>
  )
}

