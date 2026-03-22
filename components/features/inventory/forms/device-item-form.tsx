'use client'

import { useEffect, useMemo, useState } from 'react'
import { CreateBatchOrItemsRequest } from '@/lib/types/inventory'
import { Button } from '@/ui/button'
import { Plus, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog'
import { Label } from '@/ui/label'
import { Input } from '@/ui/input'
import { useProducts, useProductById } from '@/lib/hooks/use-products'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  deviceItemFormSchema,
  DeviceItemFormValues,
} from '@/lib/schemas/inventory'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import ProductsSearch from '@/components/shared/forms/products-search'
import BatchSearch from '@/components/shared/forms/batch-search'
import { Textarea } from '@/ui/textarea'
import InputList from '../../../shared/forms/input-list'
import FixCostList, { type FixCost } from './shared/fix-cost-list'
import { Switch } from '@/ui/switch'
import { useCreateBatchOrItems } from '@/lib/hooks/use-inventory'

export default function DeviceItemForm({
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
  mode = 'add',
  initialValues,
  onSubmit,
  disabled = false,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
  mode?: 'add' | 'edit'
  initialValues?: Partial<{
    product_id: string
    search: string
    batch_id: string
    batchSearch: string
    name: string
    color: string
    storage?: string
    price: number
    wholesale_price: number
    cost: number
    imei: string
    notes: string
    condition: 'new' | 'used'
    used_battery_health?: number
    used_issues?: string
    used_fixes?: string
    is_on_sale?: boolean
  }>
  onSubmit?: (payload: CreateBatchOrItemsRequest) => void
  disabled?: boolean
}) {
  const { data: products = [] } = useProducts()
  const [open, setOpen] = useState(false)
  const isOpen = controlledOpen ?? open
  const setIsOpen = onOpenChange ?? setOpen
  const createBatchOrItems = useCreateBatchOrItems()

  type FormValues = DeviceItemFormValues

  const form = useForm<FormValues>({
    resolver: zodResolver(deviceItemFormSchema),
    defaultValues: {
      mode: 'single' as const,
      itemType: 'device' as const,
      product_id: initialValues?.product_id ?? '',
      search: initialValues?.search ?? '',
      batch_id: initialValues?.batch_id ?? '',
      batchSearch: initialValues?.batchSearch ?? '',
      name: initialValues?.name ?? '',
      color: initialValues?.color ?? '',
      storage: initialValues?.storage ?? '',
      cost: initialValues?.cost ?? 0,
      price: initialValues?.price ?? 0,
      wholesale_price: initialValues?.wholesale_price ?? 0,
      imei: initialValues?.imei ?? '',
      condition: initialValues?.condition ?? 'new',
      used_battery_health: initialValues?.used_battery_health,
      used_issues: initialValues?.used_issues ?? '',
      used_fixes: initialValues?.used_fixes ?? '',
      notes: initialValues?.notes ?? '',
      is_on_sale: initialValues?.is_on_sale ?? false,
    },
  })

  // Sync when opening in edit mode
  const syncInitials = useMemo(() => initialValues, [initialValues])
  if (mode === 'edit' && syncInitials) {
    // Preload form values when provided
    // Avoid uncontrolled-to-controlled warnings by setting defaults above
  }

  const productId = form.watch('product_id')
  const productSearch = form.watch('search')
  const batchId = form.watch('batch_id')
  const batchSearch = form.watch('batchSearch')
  const imei = form.watch('imei')
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  )
  const { data: productById } = useProductById(productId)
  const productData = productById || selectedProduct
  const isProductSelected = !!(selectedProduct || productById)
  const { errors } = form.formState

  // Check if IMEI already exists in inventory
  const [existingDevice, setExistingDevice] = useState<{
    name: string
    color: string
  } | null>(null)
  const [isCheckingIMEI, setIsCheckingIMEI] = useState(false)

  // Debounced IMEI check
  useEffect(() => {
    let cancelled = false

    const checkIMEI = async () => {
      if (!imei || imei.length < 15 || mode === 'edit') {
        setExistingDevice(null)
        setIsCheckingIMEI(false)
        return
      }

      setIsCheckingIMEI(true)

      try {
        const response = await fetch(
          `/api/inventory?imei=${encodeURIComponent(
            imei
          )}&excludeUnavailable=true`
        )

        if (!cancelled) {
          if (response.ok) {
            const device = await response.json()
            // Device found - it's a duplicate
            setExistingDevice(device || null)
          } else if (response.status === 404) {
            // IMEI not found - this is good, not a duplicate
            setExistingDevice(null)
          } else {
            // Other error
            console.error('Error checking IMEI:', response.status)
            setExistingDevice(null)
          }
          setIsCheckingIMEI(false)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error checking IMEI:', error)
          setExistingDevice(null)
          setIsCheckingIMEI(false)
        }
      }
    }

    const timer = setTimeout(checkIMEI, 300) // Debounce for 300ms

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [imei, mode])

  // Auto-select color from product definition when available
  useEffect(() => {
    if (productData) {
      const colors = productData.available_colors || []
      const current = form.getValues('color')
      const defaultColor = colors[0] || ''
      if (!current || !colors.includes(current)) {
        form.setValue('color', defaultColor, { shouldValidate: false })
      }
    } else {
      // Reset without triggering validation when product cleared
      form.setValue('color', '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productData])

  // Auto-select storage from product definition when available
  useEffect(() => {
    if (productData) {
      const storages = productData.available_storage || []
      const current = form.getValues('storage')
      const defaultStorage = storages[0] || ''
      if (!current || !storages.includes(current)) {
        form.setValue('storage', defaultStorage, { shouldValidate: false })
      }
    } else {
      // Reset without triggering validation when product cleared
      form.setValue('storage', '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productData])

  // Reset form when initialValues change (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      form.reset({
        mode: 'single' as const,
        itemType: 'device' as const,
        product_id: initialValues.product_id ?? '',
        search: initialValues.search ?? '',
        batch_id: initialValues.batch_id ?? '',
        batchSearch: initialValues.batchSearch ?? '',
        name: initialValues.name ?? '',
        color: initialValues.color ?? '',
        storage: initialValues.storage ?? '',
        cost: initialValues.cost ?? 0,
        price: initialValues.price ?? 0,
        wholesale_price: initialValues.wholesale_price ?? 0,
        imei: initialValues.imei ?? '',
        notes: initialValues.notes ?? '',
        condition: initialValues.condition ?? 'new',
        used_battery_health: initialValues.used_battery_health,
        used_issues: initialValues.used_issues ?? '',
        used_fixes: initialValues.used_fixes ?? '',
        is_on_sale: initialValues.is_on_sale ?? false,
      })
    }
  }, [initialValues, mode, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    // Prevent multiple submissions
    if (createBatchOrItems.isPending) {
      return
    }
    if (!validateForm(values)) {
      return
    }

    const payload: CreateBatchOrItemsRequest = {
      mode: values.mode,
      itemType: values.itemType,
      product_id: values.product_id,
      batch_id: values.batch_id || null,
      name: values.name,
      color: values.color,
      storage: values.storage || null,
      price: Number(values.price),
      wholesale_price: Number(values.wholesale_price),
      cost: Number(values.cost),
      imeis: [values.imei],
      condition: values.condition,
      notes: values.notes ?? '',
      is_on_sale: values.is_on_sale,
    }

    if (values.condition === 'used') {
      // Parse fixes from JSON string to FixCost array
      const fixesArray: FixCost[] = values.used_fixes
        ? JSON.parse(values.used_fixes)
        : []

      payload.usedDetails = {
        battery_health: values.used_battery_health,
        // Always send issues array (empty when cleared) so removals are persisted
        issues: values.used_issues
          ? values.used_issues
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [],
        // Always send fixes array (empty when cleared) so removals are persisted
        fixes:
          fixesArray.length > 0
            ? (fixesArray as Array<{ fix: string; cost: string }>)
            : [],
      }
    }

    if (onSubmit) {
      onSubmit(payload)
    } else {
      await createBatchOrItems.mutateAsync(payload)
      form.reset()
      setIsOpen(false)
    }
  })

  const validateForm = (values: FormValues) => {
    if (mode === 'add' && isCheckingIMEI) {
      form.setError('imei', {
        type: 'loading',
        message: 'Esperando verificación de IMEI…',
      })
      return false
    }
    if (selectedProduct?.category?.toLowerCase() === 'iphone' && !values.storage) {
      form.setError('storage', { type: 'required', message: 'Requerido' })
      return false
    }
    if (selectedProduct?.category?.toLowerCase() !== 'iphone') {
      form.clearErrors('storage')
    }

    // Check if IMEI already exists
    if (existingDevice && mode === 'add') {
      form.setError('imei', {
        type: 'duplicate',
        message: `Este IMEI ya existe en el inventario: ${existingDevice.name} (${existingDevice.color})`,
      })
      return false
    }

    return true
  }

  const handleDialogOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen)
    if (!nextOpen) {
      form.reset()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {mode === 'edit'
              ? 'Editar dispositivo'
              : 'Agregar dispositivo individual'}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit'
              ? 'Editar dispositivo'
              : 'Agregar dispositivo individual'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <div className="space-y-4">
              <div className="grid gap-1.5">
                <FormField
                  name="product_id"
                  render={() => (
                    <FormItem>
                      <FormLabel>Producto</FormLabel>
                      <ProductsSearch
                        value={productId || ''}
                        searchValue={productSearch || ''}
                        onValueChange={(value) =>
                          form.setValue('product_id', value)
                        }
                        onSearchChange={(search) =>
                          form.setValue('search', search)
                        }
                        onProductSelect={(product) => {
                          form.setValue('product_id', product.id, {
                            shouldValidate: true,
                          })
                          form.setValue('search', product.name)
                          form.setValue('name', product.name)
                        }}
                        error={errors.product_id}
                        filterType="product"
                        disabled={disabled}
                      />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={disabled || !isProductSelected}
                        />
                      </FormControl>
                      {isProductSelected && <FormMessage />}
                    </FormItem>
                  )}
                />
                <FormField
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={disabled || !isProductSelected}
                        >
                          <SelectTrigger
                            disabled={disabled || !isProductSelected}
                          >
                            <SelectValue placeholder="Selecciona color" />
                          </SelectTrigger>
                          <SelectContent>
                            {productData?.available_colors?.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                name="imei"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMEI</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="123..."
                          maxLength={15}
                          {...field}
                          disabled={disabled || !isProductSelected}
                          className={
                            existingDevice && mode === 'add'
                              ? 'border-red-500'
                              : ''
                          }
                          onChange={(e) => {
                            // Only allow numeric input
                            const value = e.target.value.replace(/\D/g, '')
                            field.onChange(value)
                          }}
                          onKeyDown={(e) => {
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
                          }}
                        />
                        {isCheckingIMEI && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    {existingDevice && mode === 'add' && (
                      <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-600">
                          Este IMEI ya existe: {existingDevice.name} (
                          {existingDevice.color})
                        </p>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="batch_id"
                render={() => (
                  <FormItem>
                    <FormLabel>Lote</FormLabel>
                    <BatchSearch
                      value={batchId || ''}
                      searchValue={batchSearch || ''}
                      onValueChange={(value) =>
                        form.setValue('batch_id', value, {
                          shouldValidate: true,
                        })
                      }
                      onSearchChange={(search) =>
                        form.setValue('batchSearch', search)
                      }
                      disabled={disabled || !isProductSelected}
                    />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  name="storage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Almacenamiento</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={disabled || !isProductSelected}
                        >
                          <SelectTrigger
                            disabled={disabled || !isProductSelected}
                          >
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {productData?.available_storage?.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      {isProductSelected && <FormMessage />}
                    </FormItem>
                  )}
                />
                <FormField
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo del dispositivo</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            disabled={disabled || !isProductSelected}
                            type="number"
                            max={999999999}
                            value={field.value === 0 ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '') {
                                field.onChange(0)
                              } else {
                                field.onChange(Number(value))
                              }
                            }}
                            onFocus={(e) => {
                              if (field.value === 0) {
                                e.target.select()
                              }
                            }}
                            step="0.01"
                            min="0"
                            autoFocus
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="price"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Precio de venta</FormLabel>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <FormControl>
                          <Input
                            disabled={disabled || !isProductSelected}
                            type="number"
                            value={field.value === 0 ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '') {
                                field.onChange(0)
                              } else {
                                field.onChange(Number(value))
                              }
                            }}
                            onFocus={(e) => {
                              if (field.value === 0) {
                                e.target.select()
                              }
                            }}
                            step="0.01"
                            min="0"
                            autoFocus
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full sm:w-auto"
                          disabled={disabled || !isProductSelected}
                          onClick={() => {
                            if (productData)
                              form.setValue(
                                'price',
                                Number(productData.base_price),
                                { shouldValidate: true }
                              )
                          }}
                        >
                          Usar Precio Base
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="wholesale_price"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Precio Mayorista</FormLabel>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <FormControl>
                          <Input
                            disabled={disabled || !isProductSelected}
                            type="number"
                            value={field.value === 0 ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '') {
                                field.onChange(0)
                              } else {
                                field.onChange(Number(value))
                              }
                            }}
                            onFocus={(e) => {
                              if (field.value === 0) {
                                e.target.select()
                              }
                            }}
                            step="0.01"
                            min="0"
                            autoFocus
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full sm:w-auto"
                          disabled={disabled || !isProductSelected}
                          onClick={() => {
                            if (productData)
                              form.setValue(
                                'wholesale_price',
                                Number(productData.wholesale_price),
                                { shouldValidate: true }
                              )
                          }}
                        >
                          Usar Precio Mayorista
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Condición</Label>
                  <Select
                    value={form.watch('condition')}
                    onValueChange={(v) =>
                      form.setValue('condition', v as 'new' | 'used', {
                        shouldValidate: true,
                      })
                    }
                    disabled={disabled || !isProductSelected || mode === 'edit'}
                  >
                    <SelectTrigger
                      disabled={disabled || !isProductSelected || mode === 'edit'}
                    >
                      <SelectValue placeholder="Selecciona condición" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Nuevo</SelectItem>
                      <SelectItem value="used">Usado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="gap-1.5 flex items-center">
                  <Switch
                    checked={form.watch('is_on_sale') ?? false}
                    onCheckedChange={(v) => form.setValue('is_on_sale', v)}
                    disabled={disabled || !isProductSelected}
                  />
                  <Label>En oferta</Label>
                </div>
              </div>

              {form.watch('condition') === 'used' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Salud de batería (%)</Label>
                    <Input
                      disabled={disabled || !isProductSelected}
                      type="number"
                      min={0}
                      max={100}
                      value={form.watch('used_battery_health') || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '') {
                          form.setValue('used_battery_health', undefined)
                        } else {
                          form.setValue('used_battery_health', Number(value))
                        }
                      }}
                      onFocus={(e) => {
                        const currentValue = form.watch('used_battery_health')
                        if (currentValue === 0) {
                          e.target.select()
                        }
                      }}
                    />
                  </div>
                  <div className="grid gap-1.5 sm:col-span-2">
                    <InputList
                      label="Problemas"
                      disabled={disabled || !isProductSelected}
                      value={(form.watch('used_issues') || '')
                        .split(',')
                        .map((s: string) => s.trim())
                        .filter(Boolean)}
                      onChange={(list) =>
                        form.setValue('used_issues', list.join(', '))
                      }
                      placeholder="Pantalla"
                    />
                  </div>
                  <div className="grid gap-1.5 sm:col-span-2">
                    <FixCostList
                      label="Arreglos"
                      disabled={disabled || !isProductSelected}
                      value={(() => {
                        const fixesValue = form.watch('used_fixes')
                        return fixesValue
                          ? (JSON.parse(fixesValue) as FixCost[])
                          : []
                      })()}
                      onChange={(fixes) =>
                        form.setValue('used_fixes', JSON.stringify(fixes))
                      }
                    />
                  </div>
                </div>
              )}

              <FormField
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={disabled || !isProductSelected}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                form.reset()
              }}
              disabled={createBatchOrItems.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                disabled ||
                (mode === 'add' && (isCheckingIMEI || !!existingDevice)) ||
                createBatchOrItems.isPending
              }
            >
              {createBatchOrItems.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
