import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  ProductCategory,
  ProductCategoryInsert,
  ProductCategoryUpdate,
} from '@/lib/types/product-category'

export const PRODUCT_CATEGORIES_QUERY_KEY = 'product-categories'

export function useProductCategories() {
  return useQuery<ProductCategory[]>({
    queryKey: [PRODUCT_CATEGORIES_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch('/api/product-categories')
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error ?? 'No se pudieron cargar las categorías')
      }
      return response.json()
    },
  })
}

export function useCreateProductCategory() {
  const queryClient = useQueryClient()
  return useMutation<ProductCategory, Error, ProductCategoryInsert>({
    mutationFn: async (payload) => {
      const response = await fetch('/api/product-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error ?? 'No se pudo crear la categoría')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_CATEGORIES_QUERY_KEY] })
      toast.success('Categoría creada')
    },
    onError: (error) => toast.error(`Error al crear categoría: ${error.message}`),
  })
}

export function useUpdateProductCategory() {
  const queryClient = useQueryClient()
  return useMutation<
    ProductCategory,
    Error,
    { id: string; data: ProductCategoryUpdate }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/product-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error ?? 'No se pudo actualizar la categoría')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_CATEGORIES_QUERY_KEY] })
      toast.success('Categoría actualizada')
    },
    onError: (error) =>
      toast.error(`Error al actualizar categoría: ${error.message}`),
  })
}

export function useDeleteProductCategory() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/product-categories/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error ?? 'No se pudo eliminar la categoría')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_CATEGORIES_QUERY_KEY] })
      toast.success('Categoría eliminada')
    },
    onError: (error) => toast.error(`Error al eliminar categoría: ${error.message}`),
  })
}

