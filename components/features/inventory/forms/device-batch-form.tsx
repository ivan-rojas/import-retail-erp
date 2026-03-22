'use client'

import { useEffect, useMemo, useState } from 'react'
import { CreateBatchOrItemsRequest } from '@/lib/types/inventory'
import { Button } from '@/ui/button'
import { Plus } from 'lucide-react'
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
import { DatePicker } from '@/ui/date-picker'
import { useProducts } from '@/lib/hooks/use-products'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  deviceBatchFormSchema,
  DeviceBatchFormValues,
} from '@/lib/schemas/inventory'
import ProductsSearch from '@/components/shared/forms/products-search'
import IMEIInputList from './shared/imei-input-list'
import InputList from '../../../shared/forms/input-list'
import { format, parseISO, isValid } from 'date-fns'
import FixCostList, { FixCost } from './shared/fix-cost-list'
import { useCreateBatchOrItems } from '@/lib/hooks/use-inventory'

export default function DeviceBatchForm({
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
}) {
  const { data: products = [] } = useProducts()
  const [open, setOpen] = useState(false)
  const isOpen = controlledOpen ?? open
  const setIsOpen = onOpenChange ?? setOpen
  const createBatchOrItems = useCreateBatchOrItems()

  type FormValues = DeviceBatchFormValues

  const form = useForm<FormValues>({
    resolver: zodResolver(deviceBatchFormSchema),
    defaultValues: {
      mode: 'batch' as const,
      itemType: 'device' as const,
      batchName: '',
      batchDate: format(new Date(), 'yyyy-MM-dd'),
      product_id: '',
      search: '',
      name: '',
      color: '',
      storage: '',
      cost: 0,
      price: 0,
      wholesale_price: 0,
      imeisList: [],
      condition: 'new',
      used_battery_health: undefined,
      used_issues: '',
      used_fixes: '',
    },
  })

  const productId = form.watch('product_id')
  const productSearch = form.watch('search')
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  )
  const isProductSelected = !!selectedProduct
  const { errors } = form.formState
  // Ensure a valid color is always set when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      const colors = selectedProduct.available_colors || []
      const current = form.getValues('color')
      const defaultColor = colors[0] || ''
      if (!current || !colors.includes(current)) {
        form.setValue('color', defaultColor, { shouldValidate: true })
      }
    } else {
      // Reset color if product is cleared (do not trigger validation)
      form.setValue('color', '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct])

  // Ensure a valid storage is always set when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      const storages = selectedProduct.available_storage || []
      const current = form.getValues('storage')
      const defaultStorage = storages[0] || ''
      if (!current || !storages.includes(current)) {
        form.setValue('storage', defaultStorage, { shouldValidate: true })
      }
    } else {
      // Reset storage if product is cleared (do not trigger validation)
      form.setValue('storage', '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct])

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
      name: values.name,
      color: values.color,
      storage: values.storage || null,
      price: Number(values.price),
      wholesale_price: Number(values.wholesale_price),
      cost: Number(values.cost),
      condition: values.condition,
      batch: {
        name: values.batchName,
        date: values.batchDate,
      },
      imeis: values.imeisList || [],
    }

    if (values.condition === 'used') {
      payload.usedDetails = {
        battery_health: values.used_battery_health,
        issues: values.used_issues
          ? values.used_issues
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : undefined,
        fixes: values.used_fixes
          ? (() => {
              try {
                return JSON.parse(values.used_fixes) as Array<{
                  fix: string
                  cost: string
                }>
              } catch {
                return undefined
              }
            })()
          : undefined,
      }
    }

    try {
      await createBatchOrItems.mutateAsync(payload)
      form.reset()
      setIsOpen(false)
    } catch (error) {
      // Error will be handled by the mutation hook's error state
      // or you can add custom error handling here
      console.error('Failed to create batch:', error)
    }
  })

  const validateForm = (values: FormValues) => {
    if (selectedProduct?.category?.toLowerCase() === 'iphone' && !values.storage) {
      form.setError('storage', { type: 'required', message: 'Requerido' })
      return false
    }
    if (selectedProduct?.category?.toLowerCase() !== 'iphone') {
      form.clearErrors('storage')
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
            <Plus className="h-4 w-4 mr-2" /> Agregar lote de dispositivos
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar lote de dispositivos</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  name="batchName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del lote</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="batchDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={
                            field.value
                              ? (() => {
                                  const parsedDate = parseISO(field.value)
                                  return isValid(parsedDate)
                                    ? parsedDate
                                    : undefined
                                })()
                              : undefined
                          }
                          onDateChange={(date) =>
                            field.onChange(
                              date ? format(date, 'yyyy-MM-dd') : ''
                            )
                          }
                          placeholder="Seleccionar fecha del lote"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        // Preselect first available color to satisfy validation
                        // when a product is chosen
                        const firstColor =
                          (product.available_colors || [])[0] || ''
                        form.setValue('color', firstColor, {
                          shouldValidate: true,
                        })
                      }}
                      error={errors.product_id}
                      filterType="product"
                    />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isProductSelected} />
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
                          disabled={!isProductSelected}
                        >
                          <SelectTrigger disabled={!isProductSelected}>
                            <SelectValue placeholder="Selecciona color" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedProduct?.available_colors?.map((c) => (
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
                name="imeisList"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <IMEIInputList
                        value={field.value || []}
                        onChange={field.onChange}
                        disabled={!isProductSelected}
                        error={errors.imeisList?.message}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo</FormLabel>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <FormControl>
                          <Input
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
                            disabled={!isProductSelected}
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
                    <FormItem>
                      <FormLabel>Precio</FormLabel>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <FormControl>
                          <Input
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
                            disabled={!isProductSelected}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!isProductSelected}
                          className="w-full sm:w-auto"
                          onClick={() => {
                            if (selectedProduct)
                              form.setValue(
                                'price',
                                Number(selectedProduct.base_price),
                                { shouldValidate: true }
                              )
                          }}
                        >
                          Usar base
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="wholesale_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Mayorista</FormLabel>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <FormControl>
                          <Input
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
                            disabled={!isProductSelected}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!isProductSelected}
                          className="w-full sm:w-auto"
                          onClick={() => {
                            if (selectedProduct)
                              form.setValue(
                                'wholesale_price',
                                Number(selectedProduct.wholesale_price),
                                { shouldValidate: true }
                              )
                          }}
                        >
                          Usar mayorista
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                          disabled={!isProductSelected}
                        >
                          <SelectTrigger disabled={!isProductSelected}>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedProduct?.available_storage?.map((s) => (
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
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condición</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!isProductSelected}
                        >
                          <SelectTrigger disabled={!isProductSelected}>
                            <SelectValue placeholder="Selecciona condición" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Nuevo</SelectItem>
                            <SelectItem value="used">Usado</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {form.watch('condition') === 'used' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Salud de batería (%)</Label>
                    <Input
                      disabled={!isProductSelected}
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
                  <div className="grid gap-1.5">
                    <InputList
                      label="Problemas"
                      disabled={!isProductSelected}
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
                      disabled={!isProductSelected}
                      value={(() => {
                        const fixesValue = form.watch('used_fixes')
                        if (!fixesValue) return []
                        try {
                          return JSON.parse(fixesValue) as FixCost[]
                        } catch {
                          return []
                        }
                      })()}
                      onChange={(fixes) =>
                        form.setValue('used_fixes', JSON.stringify(fixes))
                      }
                    />
                  </div>
                </div>
              )}
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
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createBatchOrItems.isPending}
              className="w-full sm:w-auto"
            >
              {createBatchOrItems.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
