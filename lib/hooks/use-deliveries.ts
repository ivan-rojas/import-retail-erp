import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { CreateDeliveryData, DeliveryDTO } from '@/lib/types/delivery'
import { toast } from 'sonner'

export const DELIVERIES_QUERY_KEY = 'deliveries'

export function useDeliveries() {
  return useQuery<DeliveryDTO[]>({
    queryKey: [DELIVERIES_QUERY_KEY],
    queryFn: () => apiClient.getDeliveries(),
  })
}

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    { deliveryId: string; status: 'delivered' | 'cancelled' | 'pending' }
  >({
    mutationFn: async ({ deliveryId, status }) => {
      await apiClient.updateDeliveryStatus(deliveryId, status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DELIVERIES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Estado de entrega actualizado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar estado de entrega: ${error.message}`)
    },
  })
}

export function useCreateDelivery() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, CreateDeliveryData>({
    mutationFn: async (data: CreateDeliveryData) => {
      await apiClient.createDelivery(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DELIVERIES_QUERY_KEY] })
      toast.success('Entrega creada exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al crear entrega: ${error.message}`)
    },
  })
}

// export function useDeliveriesBySaleId(saleId: string) {
//   return useQuery<DeliveryDTO[]>({
//     queryKey: [DELIVERIES_QUERY_KEY, 'sale', saleId],
//     queryFn: () => apiClient.getDeliveries({ saleId, withSale: true }),
//     enabled: !!saleId,
//   })
// }

// export function useDeliveriesByReservationId(reservationId: string) {
//   return useQuery<DeliveryDTO[]>({
//     queryKey: [DELIVERIES_QUERY_KEY, 'reservation', reservationId],
//     queryFn: () =>
//       apiClient.getDeliveries({ reservationId, withReservation: true }),
//     enabled: !!reservationId,
//   })
// }

// export function useDeliveriesWithDetails() {
//   return useQuery<DeliveryDTO[]>({
//     queryKey: [DELIVERIES_QUERY_KEY, 'with-details'],
//     queryFn: () =>
//       apiClient.getDeliveries({ withSale: true, withReservation: true }),
//   })
// }
