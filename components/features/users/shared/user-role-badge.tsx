import { UserRole } from '@/lib/enums'
import { Badge } from '@/ui/badge'
import { Eye, Package, Shield, Users } from 'lucide-react'
import React from 'react'

interface UserRoleBadgeProps {
  role: UserRole
}

function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const getRoleIcon = (role: UserRoleBadgeProps['role']) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />
      case 'seller':
        return <Users className="h-4 w-4 text-blue-500" />
      case 'inventory':
        return <Package className="h-4 w-4 text-yellow-500" />
      default:
        return <Eye className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleText = (role: UserRoleBadgeProps['role']) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'seller':
        return 'Vendedor'
      case 'inventory':
        return 'Inventario'
      default:
        return 'Visualizador'
    }
  }
  return (
    <Badge
      variant="outline"
      className="text-xs rounded-full flex items-center gap-1"
    >
      {getRoleIcon(role)} {getRoleText(role)}
    </Badge>
  )
}

export default UserRoleBadge
