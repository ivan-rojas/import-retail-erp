import { useSales } from '@/lib/hooks/use-sales'
import { SaleDTO } from '@/lib/types/sales'
import { useEffect, useState } from 'react'
import { Input } from '@/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Badge } from '@/ui/badge'
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Mail,
  Phone,
  Search,
  ShoppingCart,
  Trash,
  XCircle,
} from 'lucide-react'
import Instagram from '@/components/shared/icons/instagram'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface SalesSearchByNameProps {
  onSaleSelect?: (sale: SaleDTO) => void
  placeholder?: string
}

export default function SalesSearchByName({
  onSaleSelect,
  placeholder = 'Buscar por nombre, email, teléfono o Instagram...',
}: SalesSearchByNameProps) {
  const { data: salesData } = useSales()

  const [searchValue, setSearchValue] = useState('')
  const [sales, setSales] = useState<SaleDTO[]>([])
  const [filteredSales, setFilteredSales] = useState<SaleDTO[]>([])

  useEffect(() => {
    if (salesData) {
      // Filter out sales that already have valid deliveries (not cancelled)
      const salesWithNoValidDelivery = salesData.filter((sale) => {
        if (sale.status === 'deleted') return false
        const hasValidDelivery = sale.deliveries?.some(
          (delivery) => delivery.delivery_status !== 'cancelled'
        )
        return !hasValidDelivery
      })

      setSales(salesWithNoValidDelivery)
      setFilteredSales(salesWithNoValidDelivery)
    }
  }, [salesData])

  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredSales(sales)
      return
    }

    const searchTerm = searchValue.toLowerCase()
    const filtered = sales.filter((sale) => {
      const customerName = sale.customer_name?.toLowerCase() || ''
      const customerEmail = sale.customer_email?.toLowerCase() || ''
      const customerPhone = sale.customer_phone?.toLowerCase() || ''
      const customerIg = sale.customer_ig?.toLowerCase() || ''

      return (
        customerName.includes(searchTerm) ||
        customerEmail.includes(searchTerm) ||
        customerPhone.includes(searchTerm) ||
        customerIg.includes(searchTerm)
      )
    })

    setFilteredSales(filtered)
  }, [searchValue, sales])

  const handleSaleClick = (sale: SaleDTO) => {
    if (onSaleSelect) {
      onSaleSelect(sale)
    }
  }

  const getSaleStatusText = (
    status: 'sold' | 'reserved' | 'cancelled' | 'deleted'
  ) => {
    if (status === 'sold') return 'Vendido'
    if (status === 'reserved') return 'Reservado'
    if (status === 'cancelled') return 'Cancelado'
    if (status === 'deleted') return 'Eliminado'
    return 'Pendiente'
  }

  const getSaleStatusIcon = (
    status: 'sold' | 'reserved' | 'cancelled' | 'deleted'
  ) => {
    if (status === 'sold')
      return <CheckCircle className="h-3 w-3 text-green-600" />
    if (status === 'reserved')
      return <Clock className="h-3 w-3 text-yellow-600" />
    if (status === 'cancelled')
      return <XCircle className="h-3 w-3 text-red-600" />
    if (status === 'deleted') return <Trash className="h-3 w-3 text-red-600" />
    return <ShoppingCart className="h-3 w-3 text-muted-foreground" />
  }
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredSales.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            {searchValue
              ? 'No se encontraron ventas'
              : 'No hay ventas disponibles'}
          </div>
        ) : (
          filteredSales.map((sale) => (
            <Card
              key={sale.id}
              role="button"
              tabIndex={0}
              className="cursor-pointer bg-background hover:bg-card transition-colors"
              onClick={() => handleSaleClick(sale)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleSaleClick(sale)
                }
              }}
            >
              <CardHeader className="pb-1">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {sale.customer_name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 w-fit rounded-full"
                  >
                    <div className="flex items-center gap-1">
                      {getSaleStatusIcon(sale.status)}
                      {getSaleStatusText(sale.status)}
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex gap-1 justify-between items-end pt-0">
                <div className="space-y-1 text-sm text-muted-foreground">
                  {sale.customer_email && (
                    <div>
                      <Mail className="h-3 w-3" /> {sale.customer_email}
                    </div>
                  )}
                  {sale.customer_phone && (
                    <div>
                      <Phone className="h-3 w-3" /> {sale.customer_phone}
                    </div>
                  )}
                  {sale.customer_ig && (
                    <div className="flex items-center gap-1">
                      <Instagram className="h-3 w-3" /> {sale.customer_ig}
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex flex-col gap-1 items-end">
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(sale.sale_date), 'dd/MM/yyyy', {
                      locale: es,
                    })}
                  </p>
                  <p className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> ${sale.sale_price}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
