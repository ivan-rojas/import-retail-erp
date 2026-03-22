'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { Textarea } from '@/ui/textarea'
import { X, Plus, Smartphone } from 'lucide-react'
import { Badge } from '@/ui/badge'
import { useProducts } from '@/lib/hooks/use-products'
import type { Product } from '@/lib/types/product'
import type { TradeInItem } from '@/lib/types/inventory'
import ProductsSearch from '@/components/shared/forms/products-search'
import InputList from '@/components/shared/forms/input-list'
import { getConditionLabel } from '@/lib/utils/items'
import { ItemCondition } from '@/lib/enums'

interface TradeInSelectionProps {
  tradeIns: TradeInItem[]
  onTradeInsChange: (tradeIns: TradeInItem[]) => void
}

const DEVICE_CONDITIONS = [
  { value: 'new', label: 'Nuevo' },
  { value: 'used', label: 'Usado' },
  { value: 'refurbished', label: 'Reacondicionado' },
] as const

export default function TradeInSelection({
  tradeIns,
  onTradeInsChange,
}: TradeInSelectionProps) {
  const { data: products = [] } = useProducts()
  const [showForm, setShowForm] = useState(false)
  const [currentTradeIn, setCurrentTradeIn] = useState<Partial<TradeInItem>>({
    product_id: '',
    device_name: '',
    model: '',
    color: '',
    storage: '',
    imei: '',
    condition: 'used',
    battery_health: 100,
    issues: [],
    trade_in_value: 0,
    notes: '',
    products: undefined,
  })

  // State for products search
  const [productSearchValue, setProductSearchValue] = useState('')

  // State for IMEI validation
  const [existingDevice, setExistingDevice] = useState<{
    name: string
    color: string
  } | null>(null)
  const [isCheckingIMEI, setIsCheckingIMEI] = useState(false)

  // Refs for debouncing and request cancellation
  const timerRef = useRef<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Check for duplicate IMEI when IMEI changes (debounced)
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // If IMEI is too short, clear existing device immediately
    if (!currentTradeIn.imei || currentTradeIn.imei.length < 14) {
      setExistingDevice(null)
      setIsCheckingIMEI(false)
      // Return cleanup function even for early return
      return () => {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
          abortControllerRef.current = null
        }
      }
    }

    // Create new AbortController for this debounced request
    abortControllerRef.current = new AbortController()
    const currentAbortController = abortControllerRef.current

    const checkIMEI = async () => {
      // Double-check IMEI is still valid
      if (!currentTradeIn.imei || currentTradeIn.imei.length < 14) {
        setExistingDevice(null)
        setIsCheckingIMEI(false)
        return
      }

      setIsCheckingIMEI(true)
      try {
        const response = await fetch(
          `/api/inventory?imei=${encodeURIComponent(
            currentTradeIn.imei
          )}&excludeDeleted=true&excludeUnavailable=true`,
          { signal: currentAbortController.signal }
        )
        if (response.ok) {
          const device = await response.json()
          setExistingDevice(device)
        } else {
          setExistingDevice(null)
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Error checking IMEI:', error)
        setExistingDevice(null)
      } finally {
        setIsCheckingIMEI(false)
      }
    }

    // Schedule the check after debounce delay
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      checkIMEI()
    }, 450) // 450ms debounce delay

    // Cleanup: clear timer and abort request
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [currentTradeIn.imei])
  // Get selected product details
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === currentTradeIn.product_id),
    [products, currentTradeIn.product_id]
  )

  // Get available colors for selected product
  const availableColors = useMemo(
    () => selectedProduct?.available_colors || [],
    [selectedProduct]
  )

  // Get available storage options for selected product
  const availableStorage = useMemo(
    () => selectedProduct?.available_storage || [],
    [selectedProduct]
  )

  const handleAddTradeIn = async () => {
    if (
      !currentTradeIn.product_id ||
      !currentTradeIn.color ||
      !currentTradeIn.imei
    ) {
      alert(
        'Por favor completa los campos obligatorios: Dispositivo, Color e IMEI'
      )
      return
    }

    if (!selectedProduct) {
      alert('El producto seleccionado ya no está disponible')
      return
    }

    // Check if IMEI already exists
    if (existingDevice) {
      alert(
        `Este IMEI ya existe en el inventario: ${existingDevice.name} (${existingDevice.color})`
      )
      return
    }

    const newTradeIn: TradeInItem = {
      id: crypto.randomUUID(),
      product_id: currentTradeIn.product_id!,
      device_name: currentTradeIn.device_name!,
      model: currentTradeIn.model!,
      color: currentTradeIn.color!,
      storage: currentTradeIn.storage,
      imei: currentTradeIn.imei!,
      condition: currentTradeIn.condition || 'used',
      battery_health: currentTradeIn.battery_health,
      issues: currentTradeIn.issues || [],
      trade_in_value: currentTradeIn.trade_in_value || 0,
      notes: currentTradeIn.notes,
      products: selectedProduct!,
    }

    onTradeInsChange([...tradeIns, newTradeIn])
    setCurrentTradeIn({
      product_id: '',
      device_name: '',
      model: '',
      color: '',
      storage: '',
      imei: '',
      condition: 'used',
      battery_health: 100,
      issues: [],
      trade_in_value: 0,
      notes: '',
      products: undefined,
    })
    setProductSearchValue('')
    setShowForm(false)
  }

  const handleRemoveTradeIn = (id: string) => {
    onTradeInsChange(tradeIns.filter((item) => item.id !== id))
  }

  const handleProductSelect = (product: Product) => {
    setCurrentTradeIn((prev) => ({
      ...prev,
      product_id: product.id,
      device_name: product.name,
      model: product.model,
      color: '', // Reset color when product changes
      storage: '', // Reset storage when product changes
    }))
    setProductSearchValue(product.name) // Set search value to selected product name
  }

  const totalTradeInValue = tradeIns.reduce(
    (sum, item) => sum + item.trade_in_value,
    0
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Dispositivos como Parte de Pago
          {totalTradeInValue > 0 && (
            <Badge variant="secondary">
              Total: ${totalTradeInValue.toFixed(2)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Trade-ins */}
        {tradeIns.length > 0 && (
          <div className="space-y-2">
            {tradeIns.map((tradeIn) => (
              <div
                key={tradeIn.id}
                className="flex items-start justify-between gap-3 p-3 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium">
                    {tradeIn.device_name} {tradeIn.model}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tradeIn.color} {tradeIn.storage && `• ${tradeIn.storage}`}{' '}
                    • {tradeIn.imei}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getConditionLabel(tradeIn.condition as ItemCondition)} • $
                    {tradeIn.trade_in_value.toFixed(2)}
                    {tradeIn.battery_health &&
                      ` • Batería: ${tradeIn.battery_health}%`}
                  </div>
                  {tradeIn.issues.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {tradeIn.issues.map((issue) => (
                        <Badge
                          key={issue}
                          variant="destructive"
                          className="text-xs"
                        >
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveTradeIn(tradeIn.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add Trade-in Form */}
        {showForm ? (
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dispositivo *</Label>
                <ProductsSearch
                  value={currentTradeIn.product_id || ''}
                  searchValue={productSearchValue}
                  onValueChange={() => {
                    setCurrentTradeIn((prev) => ({
                      ...prev,
                      product_id: '',
                      device_name: '',
                      model: '',
                      color: '',
                      storage: '',
                    }))
                    setProductSearchValue('')
                  }}
                  onSearchChange={(search) => setProductSearchValue(search)}
                  onProductSelect={(product) => handleProductSelect(product)}
                  placeholder="Buscar dispositivo..."
                  filterType="product"
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input
                  value={currentTradeIn.model}
                  onChange={(e) =>
                    setCurrentTradeIn((prev) => ({
                      ...prev,
                      model: e.target.value,
                    }))
                  }
                  placeholder="Iphone 15 Pro Max"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Color *</Label>
                <Select
                  value={currentTradeIn.color}
                  onValueChange={(value) =>
                    setCurrentTradeIn((prev) => ({
                      ...prev,
                      color: value,
                    }))
                  }
                  disabled={!currentTradeIn.product_id}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColors.map((color: string) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Almacenamiento</Label>
                <Select
                  value={currentTradeIn.storage || ''}
                  onValueChange={(value) =>
                    setCurrentTradeIn((prev) => ({
                      ...prev,
                      storage: value,
                    }))
                  }
                  disabled={
                    !currentTradeIn.product_id || !availableStorage.length
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStorage.map((storage: string) => (
                      <SelectItem key={storage} value={storage}>
                        {storage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condición</Label>
                <Select
                  value={currentTradeIn.condition}
                  onValueChange={(value: 'new' | 'used' | 'refurbished') =>
                    setCurrentTradeIn((prev) => ({ ...prev, condition: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar condición" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_CONDITIONS.map((condition) => (
                      <SelectItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>IMEI *</Label>
                <div className="relative">
                  <Input
                    value={currentTradeIn.imei}
                    onChange={(e) =>
                      setCurrentTradeIn((prev) => ({
                        ...prev,
                        imei: e.target.value,
                      }))
                    }
                    placeholder="331231231231231"
                    maxLength={16}
                    className={existingDevice ? 'border-destructive' : ''}
                  />
                  {isCheckingIMEI && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground"></div>
                    </div>
                  )}
                </div>
                {existingDevice && (
                  <p className="text-sm text-destructive-foreground">
                    ⚠️ Este IMEI ya existe: {existingDevice.name} (
                    {existingDevice.color})
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Salud de Batería (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={
                    currentTradeIn.battery_health === 0
                      ? ''
                      : currentTradeIn.battery_health
                  }
                  onChange={(e) => {
                    const value = e.target.value
                    setCurrentTradeIn((prev) => ({
                      ...prev,
                      battery_health: value === '' ? 0 : parseInt(value) || 0,
                    }))
                  }}
                  onFocus={(e) => {
                    if (currentTradeIn.battery_health === 0) {
                      e.target.select()
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Trade-In ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    currentTradeIn.trade_in_value === 0
                      ? ''
                      : currentTradeIn.trade_in_value
                  }
                  onChange={(e) => {
                    const value = e.target.value
                    setCurrentTradeIn((prev) => ({
                      ...prev,
                      trade_in_value: value === '' ? 0 : parseFloat(value) || 0,
                    }))
                  }}
                  onFocus={(e) => {
                    if (currentTradeIn.trade_in_value === 0) {
                      e.target.select()
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <InputList
                value={currentTradeIn.issues || []}
                onChange={(items) => {
                  setCurrentTradeIn((prev) => ({
                    ...prev,
                    issues: items,
                  }))
                }}
                label="Problemas"
                itemLabelSingular="problema"
                placeholder="Ingresa un problema y presiona + o Enter"
              />
            </div>

            <div className="space-y-2">
              <Label>Notas adicionales</Label>
              <Textarea
                value={currentTradeIn.notes}
                onChange={(e) =>
                  setCurrentTradeIn((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Detalles adicionales sobre el dispositivo..."
                rows={3}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                className="w-full sm:w-auto"
                onClick={handleAddTradeIn}
                disabled={!!existingDevice}
              >
                Agregar al Carrito
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowForm(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Dispositivo
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
