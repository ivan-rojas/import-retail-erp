import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/ui/alert-dialog'
import { Button } from '@/ui/button'
import { Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { UserProfile } from '@/lib/auth/auth'

interface DeleteUserProps {
  onUserUpdated: () => void
  userProfile: UserProfile
}

function DeleteUser({ onUserUpdated, userProfile }: DeleteUserProps) {
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null)

  const handleDeleteUser = async (userId: string) => {
    setLoadingDelete(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error || 'No se pudo eliminar el usuario')
      }
      onUserUpdated()
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setLoadingDelete(null)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={loadingDelete === userProfile.id}
        >
          <Trash2 className="h-4 w-4 text-white" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará el usuario y su rol
            asociado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={loadingDelete === userProfile.id}
            onClick={() => handleDeleteUser(userProfile.id)}
          >
            {loadingDelete === userProfile.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Eliminar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteUser
