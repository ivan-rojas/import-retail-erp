'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Badge } from '@/ui/badge'
import { Plus, X, AlertCircle } from 'lucide-react'

interface IMEIInputListProps {
  value: string[]
  onChange: (imeis: string[]) => void
  disabled?: boolean
  error?: string
}

export default function IMEIInputList({
  value,
  onChange,
  disabled = false,
  error,
}: IMEIInputListProps) {
  const [currentIMEI, setCurrentIMEI] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [duplicateIMEIs, setDuplicateIMEIs] = useState<string[]>([])
  const [checkingIMEI, setCheckingIMEI] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)

  // Check if IMEI exists in database
  const checkIMEIExists = async (imei: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/inventory?imei=${encodeURIComponent(
          imei
        )}&excludeUnavailable=true`
      )
      if (response.ok) {
        const existingDevice = await response.json()
        return !!existingDevice
      }
      return false
    } catch (error) {
      console.error('Error checking IMEI:', error)
      return false
    }
  }

  // Validate IMEI format (basic validation)
  const isValidIMEI = (imei: string): boolean => {
    return /^\d{14,16}$/.test(imei)
  }

  // Add IMEI to list
  const handleAddIMEI = async () => {
    const trimmedIMEI = currentIMEI.trim()
    setInputError(null)

    if (!trimmedIMEI) {
      setInputError('Ingresa un IMEI')
      return
    }

    // Validate format
    if (!isValidIMEI(trimmedIMEI)) {
      setInputError('El IMEI debe tener entre 14 y 16 dígitos numéricos')
      return
    }

    // Check if IMEI is already in the list
    if (value.includes(trimmedIMEI)) {
      setInputError('Este IMEI ya está en la lista')
      return
    }

    setIsChecking(true)
    setCheckingIMEI(trimmedIMEI)

    try {
      // Check if IMEI exists in database
      const existsInDB = await checkIMEIExists(trimmedIMEI)

      if (existsInDB) {
        // Add to duplicate list
        setDuplicateIMEIs((prev) => [...prev, trimmedIMEI])
        setInputError('Este IMEI ya existe en la base de datos')
      } else {
        // Add to main list
        onChange([...value, trimmedIMEI])
        setCurrentIMEI('')
      }
    } catch (error) {
      console.error('Error adding IMEI:', error)
      setInputError('Error al verificar el IMEI')
    } finally {
      setIsChecking(false)
      setCheckingIMEI(null)
    }
  }

  // Remove IMEI from list
  const handleRemoveIMEI = (imeiToRemove: string) => {
    const newList = value.filter((imei) => imei !== imeiToRemove)
    onChange(newList)

    // Remove from duplicates if it was there
    setDuplicateIMEIs((prev) => prev.filter((imei) => imei !== imeiToRemove))
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddIMEI()
    }
  }

  // Clear input error when user starts typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input
    const value = e.target.value.replace(/\D/g, '')
    setCurrentIMEI(value)
    if (inputError) {
      setInputError(null)
    }
  }

  // Prevent non-numeric key presses
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, and arrow keys
    if (
      [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
      ].includes(e.key)
    ) {
      return
    }
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (
      (e.ctrlKey || e.metaKey) &&
      ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())
    ) {
      return
    }
    // Prevent if not a number
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault()
    }
  }

  // Check for duplicates when value changes
  useEffect(() => {
    const checkDuplicates = async () => {
      if (value.length === 0) {
        setDuplicateIMEIs([])
        return
      }

      setIsChecking(true)
      const duplicates: string[] = []

      for (const imei of value) {
        try {
          const exists = await checkIMEIExists(imei)
          if (exists) {
            duplicates.push(imei)
          }
        } catch (error) {
          console.error('Error checking IMEI:', error)
        }
      }

      setDuplicateIMEIs(duplicates)
      setIsChecking(false)
    }

    checkDuplicates()
  }, [value])

  return (
    <div className="space-y-3">
      <Label>IMEIs</Label>

      {/* Input field with add button */}
      <div className="flex gap-2">
        <Input
          value={currentIMEI}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            handleKeyDown(e)
            handleKeyPress(e)
          }}
          placeholder="Ingresa un IMEI (14-16 dígitos)"
          disabled={disabled || isChecking}
          maxLength={16}
          className={`flex-1 ${inputError ? 'border-destructive' : ''}`}
        />
        <Button
          type="button"
          onClick={handleAddIMEI}
          disabled={
            disabled ||
            isChecking ||
            !currentIMEI.trim() ||
            !isValidIMEI(currentIMEI.trim()) ||
            value.includes(currentIMEI.trim())
          }
          size="sm"
        >
          {isChecking && checkingIMEI === currentIMEI.trim() ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Error messages */}
      {inputError && <p className="text-sm text-destructive">{inputError}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* IMEI list */}
      {value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              IMEIs agregados ({value.length}):
            </span>
            {isChecking && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-muted-foreground"></div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {value.map((imei) => {
              const isDuplicate = duplicateIMEIs.includes(imei)
              return (
                <Badge
                  key={imei}
                  variant={isDuplicate ? 'destructive' : 'secondary'}
                  className="flex items-center gap-1 px-2 py-1"
                >
                  {isDuplicate && <AlertCircle className="h-3 w-3" />}
                  <span className="text-xs">
                    {imei.length > 20 ? `${imei.slice(0, 20)}...` : imei}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveIMEI(imei)}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Ingresa IMEIs de entre 14 y 16 dígitos. Presiona Enter o haz clic en +
        para agregar.
      </p>
    </div>
  )
}
