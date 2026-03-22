'use client'

import { useMemo, useState, useEffect } from 'react'
import { CreateBatchOrItemsRequest } from '@/lib/types/inventory'
import { Button } from '@/ui/button'
import { Loader2, Plus } from 'lucide-react'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog'
import { Input } from '@/ui/input'
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
  accessoryItemFormSchema,
  AccessoryItemFormValues,
} from '@/lib/schemas/inventory'
import ProductsSearch from '@/components/shared/forms/products-search'
import BatchSearch from '@/components/shared/forms/batch-search'
import { Textarea } from '@/ui/textarea'
import { useCreateBatchOrItems } from '@/lib/hooks/use-inventory'

export default function AccessoryItemForm({
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
    cost: number
    price: number
    wholesale_price: number
    quantity: number
    notes: string
  }>
  onSubmit?: (payload: CreateBatchOrItemsRequest) => void
  disabled?: boolean
}) {
  const { data: products = [] } = useProducts()
  const [open, setOpen] = useState(false)
  const isOpen = controlledOpen ?? open
  const setIsOpen = onOpenChange ?? setOpen
  const createBatchOrItems = useCreateBatchOrItems()

  type FormValues = AccessoryItemFormValues

  const form = useForm<FormValues>({
    resolver: zodResolver(accessoryItemFormSchema),
    defaultValues: {
      mode: 'single' as const,
      itemType: 'accessory' as const,
      product_id: initialValues?.product_id ?? '',
      search: initialValues?.search ?? '',
      batch_id: initialValues?.batch_id ?? '',
      batchSearch: initialValues?.batchSearch ?? '',
      name: initialValues?.name ?? '',
      color: initialValues?.color ?? '',
      cost: initialValues?.cost ?? 0,
      price: initialValues?.price ?? 0,
      wholesale_price: initialValues?.wholesale_price ?? 0,
      quantity: initialValues?.quantity ?? 1,
      notes: initialValues?.notes ?? '',
    },
  })

  const productId = form.watch('product_id')
  const productSearch = form.watch('search')
  const batchId = form.watch('batch_id')
  const batchSearch = form.watch('batchSearch')
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  )
  const isProductSelected = !!selectedProduct

  // Reset form when initialValues change (for edit mode after save)
  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      form.reset({
        mode: 'single' as const,
        itemType: 'accessory' as const,
        product_id: initialValues?.product_id ?? '',
        search: initialValues?.search ?? '',
        batch_id: initialValues?.batch_id ?? '',
        batchSearch: initialValues?.batchSearch ?? '',
        name: initialValues?.name ?? '',
        color: initialValues?.color ?? '',
        cost: initialValues?.cost ?? 0,
        price: initialValues?.price ?? 0,
        wholesale_price: initialValues?.wholesale_price ?? 0,
        quantity: initialValues?.quantity ?? 1,
        notes: initialValues?.notes ?? '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, mode])

  // Auto-select first available color when a product is selected
  useEffect(() => {
    if (!isProductSelected) return
    const currentColor = form.getValues('color')
    if (currentColor) return
    const firstColor = selectedProduct?.available_colors?.[0]
    if (firstColor) {
      form.setValue('color', firstColor, { shouldValidate: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProductSelected, selectedProduct])

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const payload: CreateBatchOrItemsRequest = {
        mode: values.mode,
        itemType: values.itemType,
        product_id: values.product_id,
        batch_id: values.batch_id || null,
        name: values.name,
        color: values.color ?? '',
        price: Number(values.price),
        cost: Number(values.cost ?? 0),
        wholesale_price: Number(values.wholesale_price),
        quantity: Number(values.quantity),
        notes: values.notes,
      }

      if (onSubmit) {
        onSubmit(payload)
      } else {
        await createBatchOrItems.mutateAsync(payload)
      }
      form.reset()
      setIsOpen(false)
    } catch (error) {
      // Handle error - show toast notification or set form error
      console.error('Failed to save accessory:', error)
    }
  })

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
            <Plus className="h-4 w-4 mr-2" />{' '}
            {mode === 'edit' ? 'Editar accesorio' : 'Agregar accesorio'}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Editar accesorio' : 'Agregar accesorio'}
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
                        error={form.formState.errors.product_id}
                        filterType="accessory"
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
                      <FormMessage />
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
                            <SelectValue placeholder="Selecciona un color" />
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
                            disabled={disabled || !isProductSelected}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={
                            !isProductSelected ||
                            selectedProduct?.base_price <= 0
                          }
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
                            disabled={disabled || !isProductSelected}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={
                            !isProductSelected ||
                            selectedProduct?.wholesale_price <= 0
                          }
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
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value}
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
                          disabled={disabled || !isProductSelected}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                            disabled={disabled || !isProductSelected}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={disabled || createBatchOrItems.isPending}
              className="w-full sm:w-auto"
            >
              {createBatchOrItems.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
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
