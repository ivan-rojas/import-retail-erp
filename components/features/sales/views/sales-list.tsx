'use client'

import { ShoppingCart, Phone, Mail, Calendar } from 'lucide-react'
import Instagram from '@/components/shared/icons/instagram'
import type { SaleDTO } from '@/lib/types/sales'
import SalesStatusBadge from '../shared/sales-status-badge'
import { PaymentMethod } from '@/lib/enums'
import SalesPaymentMethodBadge from '../shared/sales-payment-method-badge'
import SalesProductsDisplay from './sales-products-display'

interface SalesListProps {
  data: SaleDTO[]
}

export default function SalesList({ data }: SalesListProps) {
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

  return (
    <div className="space-y-4">
      {data.map((sale) => (
        <div
          key={sale.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-semibold">{sale.customer_name}</h3>
              <SalesProductsDisplay sale={sale} variant="list" />
              <div className="flex items-center gap-4 mt-1">
                {sale.customer_ig && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Instagram />
                    {sale.customer_ig}
                  </span>
                )}
                {sale.customer_phone && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {sale.customer_phone}
                  </span>
                )}
                {sale.customer_email && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {sale.customer_email}
                  </span>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {sale.sale_date}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-4">
              <SalesStatusBadge status={sale.status} />
              {sale.payment_method && (
                <SalesPaymentMethodBadge
                  paymentMethod={sale.payment_method as PaymentMethod}
                />
              )}
            </div>
            <div className="text-right">
              <div className="font-semibold">${sale.sale_price}</div>
              <div className="text-xs text-muted-foreground">
                {sale.seller_name}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
