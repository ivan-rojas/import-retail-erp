import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import type { Sale, SaleDTO } from '@/lib/types/sales'
import { PaymentDTO } from '../types/payment'
import { InventoryItem } from '../types/inventory'
import {
  INVENTORY_QUERY_KEY,
  PRODUCT_ITEM_BY_IMEI_QUERY_KEY,
} from './use-inventory'

export const SALES_QUERY_KEY = 'sales'

export function useSales() {
  return useQuery<SaleDTO[]>({
    queryKey: [SALES_QUERY_KEY],
    queryFn: () => apiClient.getSales(),
  })
}

export function useSaleById(id: string) {
  return useQuery<SaleDTO>({
    queryKey: [SALES_QUERY_KEY, id],
    queryFn: () => apiClient.getSaleById(id),
    enabled: !!id,
  })
}

// Hook for getting sales with full details (products, payments, etc.)
export function useSalesWithDetails() {
  return useQuery<SaleDTO[]>({
    queryKey: [SALES_QUERY_KEY, 'with-details'],
    queryFn: () => apiClient.getSales(),
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()

  return useMutation<Sale, Error, SaleDTO>({
    mutationFn: (data: SaleDTO) => apiClient.createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] })
      queryClient.invalidateQueries({
        queryKey: [PRODUCT_ITEM_BY_IMEI_QUERY_KEY],
      })
      toast.success('Venta registrada exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al registrar venta: ${error.message}`)
    },
  })
}

export function useUpdateSale() {
  const queryClient = useQueryClient()

  return useMutation<Sale, Error, { id: string; data: SaleDTO }>({
    mutationFn: ({ id, data }: { id: string; data: SaleDTO }) =>
      apiClient.updateSale(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] })
      queryClient.invalidateQueries({
        queryKey: [PRODUCT_ITEM_BY_IMEI_QUERY_KEY],
      })
      toast.success('Venta actualizada exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar venta: ${error.message}`)
    },
  })
}

export function useDeleteSale() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => apiClient.deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] })
      queryClient.invalidateQueries({
        queryKey: [PRODUCT_ITEM_BY_IMEI_QUERY_KEY],
      })
      toast.success('Venta eliminada exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar venta: ${error.message}`)
    },
  })
}

export function useCompleteSale() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    { id: string; data: PaymentDTO | PaymentDTO[]; savePayments: boolean }
  >({
    mutationFn: ({
      id,
      data,
      savePayments,
    }: {
      id: string
      data: PaymentDTO | PaymentDTO[]
      savePayments: boolean
    }) => apiClient.completeSale(id, data, savePayments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] })
      queryClient.invalidateQueries({
        queryKey: [PRODUCT_ITEM_BY_IMEI_QUERY_KEY],
      })
      toast.success('Venta completada exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al completar venta: ${error.message}`)
    },
  })
}

export function useInventoryItemsForSale() {
  return useQuery<InventoryItem[]>({
    queryKey: ['inventory-items-for-sale'],
    queryFn: () => apiClient.getInventoryItemsForSale(),
  })
}
