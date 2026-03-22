'use client'

import { useState } from 'react'
import { useAudits, type AuditFilters } from '@/lib/hooks/use-audit'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { Badge } from '@/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import { Skeleton } from '@/ui/skeleton'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useUsers } from '@/lib/hooks/use-users'
import { format } from 'date-fns'

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>({
    limit: 50,
    offset: 0,
  })
  const [currentPage, setCurrentPage] = useState(0)

  const { data: auditLogs, isLoading, error, refetch } = useAudits(filters)
  const { data: usersData } = useUsers()

  const handleFilterChange = (
    key: keyof AuditFilters,
    value: string | number | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      offset: 0, // Reset to first page when filters change
    }))
    setCurrentPage(0)
  }

  const handlePageChange = (newPage: number) => {
    const newOffset = newPage * (filters.limit || 50)
    setFilters((prev) => ({ ...prev, offset: newOffset }))
    setCurrentPage(newPage)
  }

  const getActionBadgeText = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'Crear'
      case 'UPDATE':
        return 'Actualizar'
      case 'DELETE':
        return 'Eliminar'
      case 'SALE_COMPLETE':
        return 'Venta Completada'
      case 'RESERVATION_CREATE':
        return 'Reserva Creada'
      case 'PAYMENT_CREATE':
        return 'Pago Creado'
      case 'INVENTORY_ADJUST':
        return 'Ajuste de Inventario'
      default:
        return 'Otro'
    }
  }

  const getTableNameText = (tableName: string) => {
    switch (tableName) {
      case 'sales':
        return 'Venta'
      case 'product_items':
        return 'Producto'
      case 'accessory_items':
        return 'Accesorio'
      case 'profiles':
        return 'Usuario'
      case 'payments':
        return 'Pago'
      case 'deliveries':
        return 'Entrega'
      default:
        return 'Otro'
    }
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Error al Cargar Registros de Auditoría
              </h3>
              <p className="text-muted-foreground mb-4">{error.message}</p>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Intentar de Nuevo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Auditoría</h1>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="text-sm font-medium mb-2 block">Acción</label>
              <Select
                value={filters.action || 'all'}
                onValueChange={(value) =>
                  handleFilterChange(
                    'action',
                    value === 'all' ? undefined : value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  <SelectItem value="CREATE">Crear</SelectItem>
                  <SelectItem value="UPDATE">Actualizar</SelectItem>
                  <SelectItem value="DELETE">Eliminar</SelectItem>
                  <SelectItem value="SALE_COMPLETE">
                    Venta Completada
                  </SelectItem>
                  <SelectItem value="INVENTORY_ADJUST">
                    Ajuste de Inventario
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Tipo de Registro
              </label>
              <Select
                value={filters.table_name || 'all'}
                onValueChange={(value) =>
                  handleFilterChange(
                    'table_name',
                    value === 'all' ? undefined : value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas los tipos</SelectItem>
                  <SelectItem value="sales">Ventas</SelectItem>
                  <SelectItem value="product_items">Productos</SelectItem>
                  <SelectItem value="accessory_items">Accesorios</SelectItem>
                  <SelectItem value="profiles">Usuarios</SelectItem>
                  <SelectItem value="payments">Pagos</SelectItem>
                  <SelectItem value="deliveries">Entregas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Usuario</label>
              <Select
                value={filters.user_id || 'all'}
                onValueChange={(value) =>
                  handleFilterChange(
                    'user_id',
                    value === 'all' ? undefined : value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas los usuarios</SelectItem>
                  {usersData?.users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name ?? user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Registros de Auditoría
            {auditLogs && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({auditLogs.length} registros)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Tipo de Registro</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getActionBadgeText(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{log.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {getTableNameText(log.table_name) || '-'}
                      </TableCell>
                      <TableCell>
                        {log.notes ? (
                          <div className="text-xs">{log.notes}</div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {auditLogs && auditLogs.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPage + 1} • {auditLogs.length} registros
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={auditLogs.length < (filters.limit || 50)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}

          {auditLogs && auditLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron registros de auditoría que coincidan con los
              filtros actuales.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
