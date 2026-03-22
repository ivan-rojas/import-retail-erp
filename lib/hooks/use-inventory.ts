import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import type {
  InventoryItem,
  CreateBatchOrItemsRequest,
} from '@/lib/types/inventory'

export const INVENTORY_QUERY_KEY = 'inventory'
export const INVENTORY_ITEM_QUERY_KEY = 'inventoryItem'
export const BATCHS_QUERY_KEY = 'batchs'
export const PRODUCT_ITEM_BY_IMEI_QUERY_KEY = 'productItemByImei'

export function useInventory(
  excludeUnavailable = false,
  includeInRepair = false,
  /** When editing a sale: include items sold/reserved to this sale so they can be re-added. */
  saleId?: string | null
) {
  return useQuery<InventoryItem[]>({
    queryKey: [
      INVENTORY_QUERY_KEY,
      { excludeUnavailable, includeInRepair, saleId },
    ],
    queryFn: () =>
      apiClient.getInventory(excludeUnavailable, includeInRepair, saleId),
    refetchOnMount: 'always',
  })
}

export function useFindProductItemByIMEI(
  imei: string,
  excludeUnavailable = false,
  includeInRepair = false,
  /** When editing a sale: allow re-adding device that is sold/reserved to this sale. */
  saleId?: string | null
) {
  return useQuery({
    queryKey: [
      PRODUCT_ITEM_BY_IMEI_QUERY_KEY,
      imei,
      { excludeUnavailable, includeInRepair, saleId },
    ],
    queryFn: () =>
      apiClient.findProductItemByIMEI(
        imei,
        excludeUnavailable,
        includeInRepair,
        saleId
      ),
    enabled: !!imei && imei.length >= 14 && imei.length <= 16,
    refetchOnMount: 'always',
    staleTime: 0,
    gcTime: 0, // Previously called cacheTime - don't cache results
  })
}

export function useInventoryItem(id: string, options?: { enabled?: boolean }) {
  return useQuery<unknown>({
    queryKey: [INVENTORY_ITEM_QUERY_KEY, id],
    queryFn: () => apiClient.getInventoryItem(id),
    enabled: options?.enabled ?? !!id,
  })
}

// Removed legacy create-inventory-batch flow. Use useCreateBatchOrItems instead.

export function useCreateBatchOrItems() {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, CreateBatchOrItemsRequest>({
    mutationFn: (data) => apiClient.createBatchOrItems(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] })
      toast.success('Inventario agregado exitosamente')
    },
    onError: (error) => {
      toast.error(`Error al agregar inventario: ${error.message}`)
    },
  })
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation<
    unknown,
    Error,
    {
      id: string
      data: {
        table: 'product_items' | 'accessory_items' | 'used_product_items'
        updates: Record<string, unknown>
      }
    }
  >({
    mutationFn: async (args) =>
      apiClient.updateInventoryItem(args.id, args.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] })
      queryClient.invalidateQueries({
        queryKey: [INVENTORY_ITEM_QUERY_KEY, id],
      })
      toast.success('Artículo actualizado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar artículo: ${error.message}`)
    },
  })
}

export function useChangeStatusInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation<
    unknown,
    Error,
    {
      id: string
      table: 'product_items' | 'accessory_items' | 'used_product_items'
      status: 'available' | 'sold' | 'reserved' | 'lost' | 'spare'
    }
  >({
    mutationFn: async ({ id, table, status }) => {
      // For used items, the status lives on the underlying product_items row
      const effectiveTable =
        table === 'used_product_items' ? 'product_items' : table
      return apiClient.updateInventoryItem(id, {
        table: effectiveTable,
        updates: { status },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] })
      toast.success('Estado del artículo actualizado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(
        `Error al actualizar el estado del artículo: ${error.message}`
      )
    },
  })
}

export function useSoftDeleteInventoryItems() {
  const queryClient = useQueryClient()
  return useMutation<
    unknown,
    Error,
    {
      items: Array<{
        id: string
        table: 'product_items' | 'accessory_items' | 'used_product_items'
      }>
    }
  >({
    mutationFn: async ({ items }) => {
      return apiClient.softDeleteInventoryItems(items)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] })
      toast.success('Artículos eliminados exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar artículos: ${error.message}`)
    },
  })
}

export function useSoftDeleteInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation<
    unknown,
    Error,
    {
      id: string
      table: 'product_items' | 'accessory_items' | 'used_product_items'
    }
  >({
    mutationFn: async ({ id, table }) => {
      // For used items, the status lives on the underlying product_items row
      const effectiveTable =
        table === 'used_product_items' ? 'product_items' : table
      return apiClient.updateInventoryItem(id, {
        table: effectiveTable,
        updates: { status: 'deleted' },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] })
      toast.success('Artículo eliminado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar artículo: ${error.message}`)
    },
  })
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteInventoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] })
      toast.success('Artículo eliminado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar artículo: ${error.message}`)
    },
  })
}

export function useBatchs() {
  return useQuery({
    queryKey: [BATCHS_QUERY_KEY],
    queryFn: () => apiClient.getBatchs(),
  })
}
