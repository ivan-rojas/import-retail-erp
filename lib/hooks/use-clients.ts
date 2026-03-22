import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import type {
  Client,
  ClientInsert,
  ClientUpdate,
  ClientBalanceDetails,
} from '@/lib/types/client'

export const CLIENTS_QUERY_KEY = 'clients'

export function useClients() {
  return useQuery<Client[]>({
    queryKey: [CLIENTS_QUERY_KEY],
    queryFn: () => apiClient.getClients(),
  })
}

export function useClientById(id: string) {
  return useQuery<Client>({
    queryKey: [CLIENTS_QUERY_KEY, id],
    queryFn: () => apiClient.getClientById(id),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation<Client, Error, ClientInsert>({
    mutationFn: (data: ClientInsert) => apiClient.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] })
      toast.success('Cliente creado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al crear cliente: ${error.message}`)
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation<Client, Error, { id: string; data: ClientUpdate }>({
    mutationFn: ({ id, data }: { id: string; data: ClientUpdate }) =>
      apiClient.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] })
      toast.success('Cliente actualizado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar cliente: ${error.message}`)
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => apiClient.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] })
      toast.success('Cliente eliminado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar cliente: ${error.message}`)
    },
  })
}

export function useClientBalanceDetails(id: string, enabled = true) {
  return useQuery<ClientBalanceDetails>({
    queryKey: [CLIENTS_QUERY_KEY, id, 'balance'],
    queryFn: () => apiClient.getClientBalanceDetails(id),
    enabled: !!id && enabled,
  })
}

export function useCreateBatchPayments() {
  const queryClient = useQueryClient()

  return useMutation<
    { data: unknown[]; success: boolean },
    Error,
    {
      saleId: string
      payments: Array<{
        amount: number
        paymentMethod: 'cash' | 'transfer' | 'crypto'
        currency?: 'USD' | 'ARS'
        exchange_rate?: number
        payment_date?: string
        payment_notes?: string | null
        surcharge_percentage?: number
        converted_amount?: number
        amount_tendered?: number
        change_amount?: number
        base_amount?: number
      }>
      saleDate: string
    }
  >({
    mutationFn: (data) => apiClient.createBatchPayments(data),
    onSuccess: (_, variables) => {
      // Invalidate client balance queries
      queryClient.invalidateQueries({
        queryKey: [CLIENTS_QUERY_KEY, variables.saleId, 'balance'],
      })
      // Also invalidate sales queries if they exist
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}
