import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  Technician,
  TechnicianInsert,
  TechnicianUpdate,
} from '@/lib/types/technician'

export const TECHNICIANS_QUERY_KEY = 'technicians'

export function useTechnicians() {
  return useQuery<Technician[]>({
    queryKey: [TECHNICIANS_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch('/api/technicians')
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to fetch technicians')
      }
      return response.json()
    },
  })
}

export function useCreateTechnician() {
  const queryClient = useQueryClient()
  return useMutation<Technician, Error, TechnicianInsert>({
    mutationFn: async (data) => {
      const response = await fetch('/api/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to create technician')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TECHNICIANS_QUERY_KEY] })
      toast.success('Técnico creado exitosamente')
    },
    onError: (error) => {
      toast.error(`Error al crear técnico: ${error.message}`)
    },
  })
}

export function useUpdateTechnician() {
  const queryClient = useQueryClient()
  return useMutation<Technician, Error, { id: string; data: TechnicianUpdate }>({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/technicians/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to update technician')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TECHNICIANS_QUERY_KEY] })
      toast.success('Técnico actualizado exitosamente')
    },
    onError: (error) => {
      toast.error(`Error al actualizar técnico: ${error.message}`)
    },
  })
}

export function useDeleteTechnician() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/technicians/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to delete technician')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TECHNICIANS_QUERY_KEY] })
      toast.success('Técnico eliminado exitosamente')
    },
    onError: (error) => {
      toast.error(`Error al eliminar técnico: ${error.message}`)
    },
  })
}

