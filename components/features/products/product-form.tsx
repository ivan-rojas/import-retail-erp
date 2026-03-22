'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { Textarea } from '@/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/form'
import { Loader2 } from 'lucide-react'
import {
  productFormInputSchema,
  productFormSchema,
  type ProductFormInputData,
} from '@/lib/schemas/product'
import type { Product } from '@/lib/types/product'
import { MultiSelect, type Option } from '@/ui/multi-select'
import { useProductCategories } from '@/lib/hooks/use-product-categories'
import { renderCategoryIcon } from '@/lib/utils/category-icons'

interface ProductFormProps {
  editingProduct?: Product | null
  onSubmit: (data: {
    name: string
    type: 'product' | 'accessory'
    category_id: string
    model: string
    available_colors: string[]
    available_storage?: string[]
    base_price: number
    wholesale_price: number
    description: string
    specifications: Record<string, string>
    status: 'active' | 'inactive' | 'deleted'
  }) => Promise<void>
  isLoading?: boolean
}

export function ProductForm({
  editingProduct,
  onSubmit,
  isLoading,
}: ProductFormProps) {
  const { data: categories = [] } = useProductCategories()
  const storageOptions: Option[] = [
    { label: '64GB', value: '64GB' },
    { label: '128GB', value: '128GB' },
    { label: '256GB', value: '256GB' },
    { label: '512GB', value: '512GB' },
    { label: '1TB', value: '1TB' },
    { label: '2TB', value: '2TB' },
  ]
  const form = useForm<ProductFormInputData>({
    resolver: zodResolver(productFormInputSchema),
    defaultValues: {
      name: editingProduct?.name || '',
      type: editingProduct?.type || 'product',
      category_id: editingProduct?.category_id || '',
      model: editingProduct?.model || '',
      available_colors: editingProduct?.available_colors.join(', ') || '',
      available_storage: editingProduct?.available_storage?.join(', ') || '',
      base_price: editingProduct?.base_price?.toString() || '',
      wholesale_price: editingProduct?.wholesale_price?.toString() || '',
      description: editingProduct?.description || '',
      specifications: editingProduct?.specifications
        ? Object.entries(editingProduct.specifications)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n')
        : '',
      status: editingProduct?.status ?? 'active',
    },
  })

  // Update form when editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      form.reset({
        name: editingProduct.name,
        type: editingProduct.type,
        category_id: editingProduct.category_id || '',
        model: editingProduct.model,
        available_colors: editingProduct.available_colors.join(', '),
        available_storage: editingProduct.available_storage?.join(', ') || '',
        base_price: editingProduct.base_price?.toString(),
        wholesale_price: editingProduct.wholesale_price?.toString(),
        description: editingProduct.description,
        specifications: Object.entries(editingProduct.specifications)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n'),
        status: editingProduct.status,
      })
    } else {
      // Reset to empty form for new product
      form.reset({
        name: '',
        type: 'product',
        category_id: '',
        model: '',
        available_colors: '',
        available_storage: '',
        base_price: '',
        wholesale_price: '',
        description: '',
        specifications: '',
        status: 'active',
      })
    }
  }, [editingProduct, form])

  const handleSubmit = form.handleSubmit(
    async (inputData: ProductFormInputData) => {
      try {
        // Transform the form data using the schema
        const productData = productFormSchema.parse(inputData)
        await onSubmit(productData)

        // Always reset form after successful submission
        form.reset()
      } catch (error) {
        console.error('Error saving product:', error)
      }
    }
  )

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="grid gap-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Producto</FormLabel>
                <FormControl>
                  <Input placeholder="iPhone 15 Pro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="product">Producto</SelectItem>
                    <SelectItem value="accessory">Accesorio</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="inline-flex items-center gap-2">
                          {renderCategoryIcon(category.icon)}
                          <span className="capitalize">{category.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input placeholder="iPhone 15 Pro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="available_colors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Colores Disponibles</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Titanio Natural, Titanio Azul, Titanio Blanco"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Separar con comas</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.watch('type') === 'product' && (
            <FormField
              control={form.control}
              name="available_storage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidades de Almacenamiento</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={storageOptions}
                      selected={(field.value || '')
                        .split(',')
                        .map((s) => s.trim())
                        .filter((s) => s)}
                      onChange={(selected) =>
                        field.onChange(selected.join(', '))
                      }
                      onBlur={field.onBlur}
                      placeholder="Seleccionar capacidades"
                      disabled={isLoading}
                      hideSearch
                    />
                  </FormControl>
                  <FormDescription>Selecciona una o más</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="base_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio Base</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="wholesale_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio Mayorista</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción detallada del producto..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Especificaciones Técnicas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Pantalla: 6.1 pulgadas Super Retina XDR&#10;Chip: A17 Pro&#10;Cámara: 48MP Principal + 12MP Ultra Gran Angular"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Una especificación por línea en formato &quot;Característica:
                Valor&quot;
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {editingProduct ? 'Actualizando...' : 'Creando...'}
            </>
          ) : editingProduct ? (
            'Actualizar Producto'
          ) : (
            'Crear Producto'
          )}
        </Button>
      </form>
    </Form>
  )
}
