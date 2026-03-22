'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import {
  ShoppingCart,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Package,
  Clock,
} from 'lucide-react'
import { format, parse } from 'date-fns'
import type { SaleDTO } from '@/lib/types/sales'
import SalesStatusBadge from '../shared/sales-status-badge'
import SalesPaymentMethodBadge from '../shared/sales-payment-method-badge'
import SalesProductsDisplay from './sales-products-display'
import { PaymentMethod } from '@/lib/enums'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/tooltip'
import Instagram from '@/components/shared/icons/instagram'
import SalesActionsMenu from './sales-actions-menu'

interface SalesTableProps {
  data: SaleDTO[]
}

export default function SalesTable({ data }: SalesTableProps) {
  const isValidDelivery = (sale: SaleDTO) => {
    if (sale.status === 'cancelled' || sale.status === 'deleted') {
      return true
    }
    return (
      sale?.deliveries?.some((d) => d.delivery_status !== 'cancelled') ?? false
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No hay ventas registradas
        </h3>
        <p className="text-muted-foreground">
          Las ventas y reservas aparecerán aquí cuando se registren.
        </p>
      </div>
    )
  }

  const warningSale = () => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent variant="warning">
            <p className="font-medium">
              Esta venta tiene conflictos que requieren resolución
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Depósito</TableHead>
            <TableHead>Método de Pago</TableHead>
            <TableHead>Fecha de Venta</TableHead>
            <TableHead>Fecha de Carga</TableHead>
            <TableHead>Fecha de Entrega</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell>
                <div>
                  <div className="font-medium flex items-center gap-1">
                    {!isValidDelivery(sale) && warningSale()}
                    {sale.customer_name}
                  </div>

                  {sale.customer_ig && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Instagram className="h-3 w-3" />
                      {sale.customer_ig}
                    </div>
                  )}
                  {sale.customer_phone && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {sale.customer_phone}
                    </div>
                  )}
                  {sale.customer_email && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {sale.customer_email}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <SalesProductsDisplay sale={sale} variant="table" />
              </TableCell>
              <TableCell>
                <SalesStatusBadge status={sale.status} />
              </TableCell>
              <TableCell>
                <span className="font-semibold">${sale.sale_price}</span>
              </TableCell>
              <TableCell>
                <span className="font-semibold">
                  {sale.reservations[0]?.deposit ? (
                    `$${sale.reservations[0]?.deposit}`
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </span>
              </TableCell>
              <TableCell>
                {sale.payment_method ? (
                  <SalesPaymentMethodBadge
                    paymentMethod={sale.payment_method as PaymentMethod}
                  />
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {sale.sale_date
                    ? format(
                        parse(sale.sale_date, 'yyyy-MM-dd', new Date()),
                        'dd/MM/yyyy'
                      )
                    : '-'}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {sale.created_at
                    ? format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')
                    : '-'}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Package className="h-3 w-3" />
                  {sale.delivery_date
                    ? format(new Date(sale.delivery_date), 'dd/MM/yyyy HH:mm')
                    : '-'}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {sale.seller_name}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <SalesActionsMenu sale={sale} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
