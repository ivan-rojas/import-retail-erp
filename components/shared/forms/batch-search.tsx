'use client'

import { useMemo, useEffect } from 'react'
import { Button } from '@/ui/button'
import { FormControl, FormMessage } from '@/ui/form'
import { useBatchs } from '@/lib/hooks/use-inventory'

interface BatchSearchProps {
  value: string
  searchValue: string
  onValueChange: (value: string) => void
  onSearchChange: (search: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function BatchSearch({
  value,
  searchValue,
  onValueChange,
  onSearchChange,
  disabled = false,
  placeholder = 'Buscar lotes por nombre...',
}: BatchSearchProps) {
  const { data: batchs = [] } = useBatchs()

  const filteredBatchOptions = useMemo(() => {
    const query = (searchValue || '').toLowerCase()
    const seenIds = new Set<string>()
    return batchs
      .filter((b) => b.name.toLowerCase().includes(query))
      .filter((b) => {
        if (seenIds.has(b.id)) return false
        seenIds.add(b.id)
        return true
      })
      .slice(0, 20)
  }, [batchs, searchValue])

  const selectedBatch = useMemo(
    () => batchs.find((b) => b.id === value),
    [batchs, value]
  )

  // Set searchValue from selectedBatch when value exists but searchValue doesn't
  useEffect(() => {
    if (value && !searchValue && selectedBatch?.name) {
      onSearchChange(selectedBatch.name)
    }
  }, [value, searchValue, selectedBatch, onSearchChange])

  return (
    <div className="relative">
      <FormControl>
        <input
          className="w-full border rounded p-2"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={disabled || !!value}
        />
      </FormControl>

      {searchValue && !value && !disabled && (
        <div className="absolute z-10 mt-1 w-full border rounded max-h-56 overflow-auto bg-background">
          {filteredBatchOptions.map((b) => (
            <button
              key={b.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-accent"
              onClick={() => {
                onValueChange(b.id)
                onSearchChange(b.name)
              }}
            >
              <div className="font-medium">{b.name}</div>
              <div className="text-xs text-muted-foreground">{b.date}</div>
            </button>
          ))}
        </div>
      )}

      {value && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground break-all">
          <span>Seleccionado: {selectedBatch?.name || value}</span>
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
