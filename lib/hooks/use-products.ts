import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import type { Product, CreateProductRequest } from '@/lib/types/product'

export const PRODUCTS_QUERY_KEY = 'products'

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: [PRODUCTS_QUERY_KEY],
    queryFn: () => apiClient.getProducts(),
  })
}

export function useProductById(id: string) {
  return useQuery<Product>({
    queryKey: [PRODUCTS_QUERY_KEY, id],
    queryFn: () => apiClient.getProductById(id),
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation<Product, Error, CreateProductRequest>({
    mutationFn: (data: CreateProductRequest) => apiClient.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] })
      toast.success('Producto creado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al crear producto: ${error.message}`)
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation<
    Product,
    Error,
    { id: string; data: Partial<CreateProductRequest> }
  >({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<CreateProductRequest>
    }) => apiClient.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] })
      toast.success('Producto actualizado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar producto: ${error.message}`)
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => apiClient.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] })
      toast.success('Producto eliminado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar producto: ${error.message}`)
    },
  })
}
