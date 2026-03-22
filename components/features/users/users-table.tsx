'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Users } from 'lucide-react'
import AddUser from './user-form'
import EditUser from './edit-user'
import DeleteUser from './delete-user'
import { useUsers } from '@/lib/hooks/use-users'
import UserRoleBadge from './shared/user-role-badge'
import { UserRole } from '@/lib/enums'

export default function UsersTable() {
  const { data: usersData, isLoading: loading, refetch } = useUsers()

  const handleUserChanged = async () => {
    await refetch()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            Cargando usuarios...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuarios del Sistema
          </CardTitle>
          <AddUser onUserCreated={handleUserChanged} />
        </div>
      </CardHeader>
      <CardContent>
        {usersData?.users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay usuarios registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Usuario</th>
                  <th className="text-left p-3 font-medium">Rol</th>
                  <th className="text-left p-3 font-medium">
                    Fecha de Registro
                  </th>
                  <th className="text-left p-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.users.map((userProfile) => (
                  <tr
                    key={userProfile.id}
                    className="border-b hover:bg-background"
                  >
                    <td className="p-3">
                      <div>
                        <div className="font-medium">
                          {userProfile.full_name || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {userProfile.email}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <UserRoleBadge role={userProfile.role as UserRole} />
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {formatDate(userProfile.created_at)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <EditUser
                          onUserUpdated={handleUserChanged}
                          userProfile={userProfile}
                        />
                        <DeleteUser
                          onUserUpdated={handleUserChanged}
                          userProfile={userProfile}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
