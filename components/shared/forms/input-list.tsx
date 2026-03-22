'use client'

import { useState } from 'react'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Badge } from '@/ui/badge'
import { Plus, X } from 'lucide-react'

interface InputListProps {
  value: string[]
  onChange: (items: string[]) => void
  disabled?: boolean
  error?: string
  label?: string
  placeholder?: string
  itemLabelSingular?: string
}

export default function InputList({
  value,
  onChange,
  disabled = false,
  error,
  label = 'Elementos',
  placeholder = 'Ingresa un elemento y presiona + o Enter',
  itemLabelSingular = 'elemento',
}: InputListProps) {
  const [current, setCurrent] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)

  const handleAdd = () => {
    const trimmed = current.trim()
    setInputError(null)

    if (!trimmed) {
      setInputError(`Ingresa un ${itemLabelSingular}`)
      return
    }

    if (value.includes(trimmed)) {
      setInputError(`Este ${itemLabelSingular} ya fue agregado`)
      return
    }

    onChange([...value, trimmed])
    setCurrent('')
  }

  const handleRemove = (toRemove: string) => {
    onChange(value.filter((i) => i !== toRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrent(e.target.value)
    if (inputError) setInputError(null)
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      <div className="flex gap-2">
        <Input
          value={current}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 ${inputError ? 'border-destructive' : ''}`}
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !current.trim() || value.includes(current.trim())}
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
            {value.map((item) => (
              <Badge key={item} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                <span className="text-xs">
                  {item.length > 40 ? `${item.slice(0, 40)}...` : item}
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
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


