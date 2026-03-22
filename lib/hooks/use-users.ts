import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { UserProfile } from '@/lib/auth/auth'
import { getUserProfiles } from '../utils/users'

export const USERS_QUERY_KEY = 'users'

export interface CreateUserData {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'seller' | 'inventory' | 'viewer'
}

export interface UpdateUserData {
  full_name?: string
  role?: 'admin' | 'seller' | 'inventory' | 'viewer'
}

export function useUsers() {
  return useQuery<{
    users: UserProfile[]
    profiles: Record<string, UserProfile>
  }>({
    queryKey: [USERS_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch('/api/admin/users')

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }

      const { users, profiles } = await response.json()

      const mapped = getUserProfiles(users, profiles)

      return {
        users: mapped,
        profiles: profiles,
      }
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation<UserProfile, Error, CreateUserData>({
    mutationFn: async (data: CreateUserData) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] })
      toast.success('Usuario creado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al crear usuario: ${error.message}`)
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation<UserProfile, Error, { id: string; data: UpdateUserData }>({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }) => {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] })
      toast.success('Usuario actualizado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar usuario: ${error.message}`)
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] })
      toast.success('Usuario eliminado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar usuario: ${error.message}`)
    },
  })
}
