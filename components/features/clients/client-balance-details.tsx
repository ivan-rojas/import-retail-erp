'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { useClientBalanceDetails } from '@/lib/hooks/use-clients'
import type { Client } from '@/lib/types/client'
import { Skeleton } from '@/ui/skeleton'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DollarSign } from 'lucide-react'
import SalesStatusBadge from '../sales/shared/sales-status-badge'
import SalesPaymentMethodBadge from '../sales/shared/sales-payment-method-badge'
import ClientPaymentModal from './client-payment-modal'

interface ClientBalanceDetailsProps {
  client: Client
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ClientBalanceDetails({
  client,
  open,
  onOpenChange,
}: ClientBalanceDetailsProps) {
  const { data, isLoading, error, refetch } = useClientBalanceDetails(
    client.id,
    open
  )
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<{
    id: string
    date: string
    price: number
    balance: number
  } | null>(null)
  const [balanceFilter, setBalanceFilter] = useState<
    'all' | 'pending' | 'paid'
  >('all')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Filter sales based on balance filter
  const filteredSales = useMemo(() => {
    if (!data?.sales) return []

    return data.sales.filter((sale) => {
      const salePaymentsTotal =
        sale.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
      const saleBalance = Number(sale.sale_price) - salePaymentsTotal

      if (balanceFilter === 'pending') {
        return saleBalance !== 0
      } else if (balanceFilter === 'paid') {
        return saleBalance === 0
      }
      return true
    })
  }, [data?.sales, balanceFilter])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalle de Balance - {client.customer_name}</DialogTitle>
        </DialogHeader>

        <DialogBody>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Error al cargar los detalles
            </div>
          ) : data ? (
            <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Ventas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(data.total_sales)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Pagos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(data.total_payments)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      data.balance > 0
                        ? 'text-red-600 dark:text-red-400'
                        : data.balance < 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {formatCurrency(Math.abs(data.balance))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.balance > 0
                      ? 'Cliente debe'
                      : data.balance < 0
                      ? 'Deuda con cliente'
                      : 'Saldado'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sales Details */}
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold">Ventas y Pagos</h3>
                <Select
                  value={balanceFilter}
                  onValueChange={(value) =>
                    setBalanceFilter(value as 'all' | 'pending' | 'paid')
                  }
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="paid">Pagadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const salePaymentsTotal =
                    sale.payments?.reduce(
                      (sum, p) => sum + Number(p.amount),
                      0
                    ) || 0
                  const saleBalance =
                    Number(sale.sale_price) - salePaymentsTotal

                  return (
                    <Card key={sale.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <CardTitle className="text-base">
                              Venta -{' '}
                              {format(new Date(sale.sale_date), 'PPP', {
                                locale: es,
                              })}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <SalesStatusBadge status={sale.status} />
                              <span className="text-sm text-muted-foreground">
                                {sale.notes}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              {formatCurrency(Number(sale.sale_price))}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Precio venta
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {sale.payments && sale.payments.length > 0 ? (
                          <>
                            <Table wrapCells>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Fecha</TableHead>
                                  <TableHead>Método</TableHead>
                                  <TableHead>Moneda</TableHead>
                                  <TableHead className="text-right">
                                    Monto
                                  </TableHead>
                                  <TableHead>Notas</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sale.payments.map((payment) => (
                                  <TableRow key={payment.id}>
                                    <TableCell>
                                      {format(
                                        new Date(payment.payment_date),
                                        'dd/MM/yyyy',
                                        { locale: es }
                                      )}
                                    </TableCell>
                                    <TableCell className="capitalize">
                                      <SalesPaymentMethodBadge
                                        paymentMethod={payment.payment_method}
                                      />
                                    </TableCell>
                                    <TableCell className="uppercase">
                                      {payment.currency}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      {formatCurrency(Number(payment.amount))}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {payment.payment_notes || '—'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                  <TableCell
                                    colSpan={3}
                                    className="text-right font-medium"
                                  >
                                    Total Pagado:
                                  </TableCell>
                                  <TableCell className="text-right font-bold">
                                    {formatCurrency(salePaymentsTotal)}
                                  </TableCell>
                                  <TableCell></TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                            <div className="mt-4 pt-4 border-t flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-sm font-medium">
                                  Balance de esta venta:
                                </span>
                                <span
                                  className={`text-lg font-bold ${
                                    saleBalance > 0
                                      ? 'text-red-600 dark:text-red-400'
                                      : saleBalance < 0
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {formatCurrency(Math.abs(saleBalance))}
                                  {saleBalance > 0 && ' (pendiente)'}
                                  {saleBalance < 0 && ' (sobrepago)'}
                                  {saleBalance === 0 && ' (saldado)'}
                                </span>
                              </div>
                              {saleBalance !== 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full sm:w-auto"
                                  onClick={() => {
                                    setSelectedSale({
                                      id: sale.id,
                                      date: sale.sale_date,
                                      price: Number(sale.sale_price),
                                      balance: saleBalance,
                                    })
                                    setPaymentModalOpen(true)
                                  }}
                                >
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  {saleBalance > 0
                                    ? 'Pagar Deuda'
                                    : 'Registrar Reembolso'}
                                </Button>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            No hay pagos registrados para esta venta
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {data?.sales && data.sales.length > 0
                      ? `No hay ventas ${
                          balanceFilter === 'pending'
                            ? 'pendientes'
                            : balanceFilter === 'paid'
                            ? 'pagadas'
                            : ''
                        } para este cliente`
                      : 'No hay ventas registradas para este cliente'}
                  </CardContent>
                </Card>
              )}
            </div>
            </div>
          ) : null}
        </DialogBody>
      </DialogContent>

      {selectedSale && (
        <ClientPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          saleId={selectedSale.id}
          saleDate={selectedSale.date}
          salePrice={selectedSale.price}
          currentBalance={selectedSale.balance}
          customerName={client.customer_name}
          onSuccess={() => {
            refetch()
          }}
        />
      )}
    </Dialog>
  )
}
