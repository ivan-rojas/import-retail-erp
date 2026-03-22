'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/ui/button'
import type { UseSaleSelectionApi } from './use-sale-selection'
import { Package, Trash2, Wrench, Plus, Link2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import IMEISearch from '@/components/shared/forms/imei-search'
import type { InventoryItem } from '@/lib/types/inventory'
import { useFindProductItemByIMEI } from '@/lib/hooks/use-inventory'

interface AddServiceDialogProps {
  selection: UseSaleSelectionApi
  disabled?: boolean
}

export function AddServiceDialog({
  selection,
  disabled,
}: AddServiceDialogProps) {
  const { state, addServiceLine } = selection
  const [serviceOpen, setServiceOpen] = useState(false)
  const [serviceName, setServiceName] = useState('')
  const [serviceModel, setServiceModel] = useState('')
  const [servicePrice, setServicePrice] = useState('')
  const [serviceQty, setServiceQty] = useState('1')
  const [serviceCost, setServiceCost] = useState('')
  const [serviceNotes, setServiceNotes] = useState('')
  const [linkedProductItemId, setLinkedProductItemId] = useState<string | null>(null)

  const [imeiSearchValue, setImeiSearchValue] = useState('')
  const [imeiSelectedValue, setImeiSelectedValue] = useState('')

  const cartDevices = state.selectedProducts.filter(
    (p) => p.table === 'product_items' || p.table === 'used_product_items'
  )

  const shouldFetchDeviceByIMEI =
    imeiSearchValue.length >= 14 && imeiSearchValue.length <= 16

  const {
    data: deviceByIMEI,
    isLoading: isFindingDevice,
    error: findDeviceError,
  } = useFindProductItemByIMEI(
    shouldFetchDeviceByIMEI ? imeiSearchValue : '',
    false, // Do NOT exclude unavailable so we can link to sold devices
    true // includeInRepair
  )

  const matchingCartDevice: InventoryItem | null =
    cartDevices.find((p) => p.imei === imeiSearchValue) ?? null

  const linkedDevice: InventoryItem | null =
    (matchingCartDevice as InventoryItem | null) ??
    ((deviceByIMEI as InventoryItem | undefined) ?? null)

  useEffect(() => {
    if (!linkedDevice) {
      return
    }

    setLinkedProductItemId(linkedDevice.id)

    if (!serviceModel) {
      const desc = [
        linkedDevice.products?.model,
        linkedDevice.storage,
        linkedDevice.color,
      ]
        .filter(Boolean)
        .join(' ')

      if (desc) {
        setServiceModel(desc.trim())
      }
    }
    // We intentionally omit serviceModel from deps to avoid overriding manual edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedDevice?.id])

  const handleAddService = () => {
    const price = parseFloat(servicePrice)
    const cost = parseFloat(serviceCost)
    const qty = parseInt(serviceQty, 10) || 1
    if (!serviceName.trim() || Number.isNaN(price) || Number.isNaN(cost) || price < 0 || cost < 0) return
    addServiceLine({
      item_name: serviceName.trim(),
      item_model: serviceModel.trim() || serviceName.trim(),
      item_price: price,
      item_quantity: qty,
      item_cost: cost,
      item_notes: serviceNotes.trim() || null,
      linked_product_item_id: linkedProductItemId || null,
    })
    setServiceName('')
    setServiceModel('')
    setServicePrice('')
    setServiceQty('1')
    setServiceCost('')
    setServiceNotes('')
    setLinkedProductItemId(null)
    setServiceOpen(false)
  }

  if (disabled) return null

  return (
    <Dialog open={serviceOpen} onOpenChange={setServiceOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Agregar servicio
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar servicio</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="service-name">Nombre *</Label>
              <Input
                id="service-name"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="ej. Cambio de pantalla"
              />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-1.5">
                <Link2 className="h-4 w-4" />
                Vincular a dispositivo por IMEI
              </Label>
              <IMEISearch
                value={imeiSelectedValue}
                searchValue={imeiSearchValue}
                onValueChange={(v) => {
                  setImeiSelectedValue(v)
                  if (!v) {
                    setLinkedProductItemId(null)
                  }
                }}
                onSearchChange={setImeiSearchValue}
                placeholder="Escribir o pegar IMEI (14-16 dígitos)"
                foundDevice={linkedDevice}
                isLoading={isFindingDevice}
                showNotFound={
                  shouldFetchDeviceByIMEI && !isFindingDevice && !linkedDevice
                }
                error={
                  findDeviceError
                    ? { message: 'Error al buscar el dispositivo' }
                    : undefined
                }
              />
              {linkedDevice && (
                <p className="text-xs text-muted-foreground">
                  Dispositivo: {linkedDevice.products?.model}{' '}
                  {linkedDevice.storage} {linkedDevice.color}
                  {linkedDevice.imei ? ` · IMEI: ${linkedDevice.imei}` : ''}
                  {matchingCartDevice ? ' (actualmente en el carrito)' : ''}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="service-model">Modelo / descripción</Label>
              <Input
                id="service-model"
                value={serviceModel}
                onChange={(e) => setServiceModel(e.target.value)}
                placeholder="ej. iPhone 13 Pro"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="service-price">Precio venta *</Label>
                <Input
                  id="service-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="service-cost">Costo *</Label>
                <Input
                  id="service-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={serviceCost}
                  onChange={(e) => setServiceCost(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="service-qty">Cantidad</Label>
              <Input
                id="service-qty"
                type="number"
                min="1"
                value={serviceQty}
                onChange={(e) => setServiceQty(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="service-notes">Notas</Label>
              <Input
                id="service-notes"
                value={serviceNotes}
                onChange={(e) => setServiceNotes(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <Button type="button" onClick={handleAddService}>
              Agregar
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

interface SelectedProductsProps {
  selection: UseSaleSelectionApi
  disabled?: boolean
}

export function SelectedProducts({
  selection,
  disabled,
}: SelectedProductsProps) {
  const { state, removeProductFromSelection, removeServiceLine, updateTradeIns } = selection

  const totalLines =
    state.selectedProducts.length + state.serviceLines.length
  if (totalLines === 0) return null

  return (
    <Card className="space-y-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Líneas de venta ({totalLines})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {state.selectedProducts.map((product, index) => (
          <div
            key={`${product.id}-${product.price}`}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div>
              <p className="font-medium">
                {product.quantity}x {product.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {product.products?.model} {product.storage} {product.color}{' '}
                {product.imei ? ` · IMEI: ${product.imei}` : ''}
              </p>
              <p className="text-sm font-medium text-primary">
                {product.price > 0 ? `$${product.price.toFixed(2)}` : 'Gratis'}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                removeProductFromSelection(product.id, product.price)
              }
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
        {state.serviceLines.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between p-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30"
          >
            <div>
              <p className="font-medium flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                {service.item_quantity}x {service.item_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {service.item_model}
              </p>
              <p className="text-sm font-medium text-primary">
                ${(service.item_price * service.item_quantity).toFixed(2)}{' '}
                <span className="text-muted-foreground font-normal">
                  (costo: ${service.item_cost.toFixed(2)})
                </span>
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeServiceLine(service.id)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
        {state.tradeIns.map((tradeIn) => (
          <div
            key={tradeIn.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div>
              <p className="font-medium">{tradeIn.device_name}</p>
              <p className="text-sm text-muted-foreground">
                {tradeIn.model} {tradeIn.color} {tradeIn.storage}
              </p>
              <p className="text-sm font-medium text-primary">
                ${tradeIn.trade_in_value.toFixed(2)}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                updateTradeIns(
                  state.tradeIns.filter((t) => t.id !== tradeIn.id)
                )
              }
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 rounded-lg border">
            <span className="font-medium">Subtotal Productos:</span>
            <span className="font-bold">
              ${Number(state.subtotalPrice).toFixed(2)}
            </span>
          </div>

          {state.tradeIns.length > 0 && (
            <div className="flex justify-between items-center p-3 rounded-lg border border-border">
              <span className="font-medium">Trade-In Descuento:</span>
              <span className="font-bold text-blue-700">
                -$
                {state.tradeIns
                  .reduce((sum, t) => sum + t.trade_in_value, 0)
                  .toFixed(2)}
              </span>
            </div>
          )}

          {Number(state.totalSurcharge) > 0 && (
            <div className="flex justify-between items-center p-3 rounded-lg border">
              <span className="font-medium text-orange-700">
                Recargos en Pagos:
              </span>
              <span className="font-bold text-orange-700">
                +${Number(state.totalSurcharge).toFixed(2)}
              </span>
            </div>
          )}

          {state.tradeIns.length > 0 && (
            <div className="flex justify-between items-center p-3 rounded-lg border border-border">
              <span className="font-semibold">Total Final:</span>
              <span className="font-bold text-green-700">
                ${Number(state.netTotal).toFixed(2)}
              </span>
            </div>
          )}

          {state.tradeIns.length === 0 && (
            <div className="flex justify-between items-center p-3 rounded-lg border border-border">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-green-700">
                ${Number(state.totalPrice).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
