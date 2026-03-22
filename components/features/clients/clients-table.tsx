'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import { Card, CardContent } from '@/ui/card'
import type { Client } from '@/lib/types/client'
import ClientActionButtons from './client-action-buttons'

interface ClientsTableProps {
  data: Client[]
  onEdit: (client: Client) => void
}

export default function ClientsTable({ data, onEdit }: ClientsTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center text-muted-foreground">
            No se encontraron clientes.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="overflow-x-auto p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Instagram</TableHead>
            <TableHead>Alias/CBU</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">
                {client.customer_name}
              </TableCell>
              <TableCell>
                {client.customer_email || (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {client.customer_phone || (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {client.customer_ig ? (
                  <span className="text-sm">{client.customer_ig}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {client.customer_alias_cbu || (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right font-medium">
                <span
                  className={
                    client.balance > 0
                      ? 'text-red-600 dark:text-red-400'
                      : client.balance < 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-muted-foreground'
                  }
                >
                  {client.balance === 0
                    ? '—'
                    : `$${Math.abs(client.balance).toFixed(2)}`}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <ClientActionButtons client={client} onEdit={onEdit} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
