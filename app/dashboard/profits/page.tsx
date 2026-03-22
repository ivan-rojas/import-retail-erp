'use client'

import { useProfitsStats } from '@/lib/hooks/use-stats'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/card'
import { ScrollArea, ScrollBar } from '@/ui/scroll-area'
import { Badge } from '@/ui/badge'
import { format, parse, subDays } from 'date-fns'
import { Loader2, MoreHorizontal } from 'lucide-react'
import { useState, useMemo, Fragment } from 'react'
import { DateRangePicker } from '@/components/shared/forms/date-range'
import { DateRange } from 'react-day-picker'
import { Button } from '@/ui/button'
import StatsBadge from '@/components/features/stats/stats-badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import DeviceItemForm from '@/components/features/inventory/forms/device-item-form'
import AccessoryItemForm from '@/components/features/inventory/forms/accessory-item-form'
import { useInventoryItem } from '@/lib/hooks/use-inventory'
import type { ProductItemRow, AccessoryItemRow } from '@/lib/types/inventory'

type GroupBy = 'none' | 'date' | 'delivery_date' | 'product' | 'customer'
type ProductFilter = 'all' | 'new' | 'used' | 'accessory' | 'service'

export default function ProfitsPage() {
  const initialRange: DateRange = {
    from: subDays(new Date(), 7),
    to: new Date(),
  }
  const [range, setRange] = useState<DateRange | undefined>(initialRange)
  const [appliedRange, setAppliedRange] = useState<DateRange | undefined>(
    initialRange
  )
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [productFilter, setProductFilter] = useState<ProductFilter>('all')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedItemType, setSelectedItemType] = useState<'product' | 'accessory' | 'service' | null>(null)
  const [deviceModalOpen, setDeviceModalOpen] = useState(false)
  const [accessoryModalOpen, setAccessoryModalOpen] = useState(false)
  
  const { data, isLoading, isFetching, error } = useProfitsStats(
    appliedRange?.from ?? undefined,
    appliedRange?.to ?? undefined
  )
  
  const { data: inventoryItem } = useInventoryItem(
    selectedItemId || '',
    { enabled: !!selectedItemId }
  )

  // If we have data, show it even if fetching (for smooth refetch experience)
  const rawData = data || {
    items: [],
    totalProfit: 0,
    totalRevenue: 0,
    totalCost: 0,
    averageProfitMargin: 0,
  }

  // Filter items based on product filter
  const filteredItems = useMemo(() => {
    if (productFilter === 'all') {
      return rawData.items
    }
    return rawData.items.filter((item) => {
      switch (productFilter) {
        case 'new':
          return item.item_type === 'product' && item.condition === 'new'
        case 'used':
          return item.item_type === 'product' && item.condition === 'used'
        case 'accessory':
          return item.item_type === 'accessory'
        case 'service':
          return item.item_type === 'service'
        default:
          return true
      }
    })
  }, [rawData.items, productFilter])

  // Recalculate totals based on filtered items
  const displayData = useMemo(() => {
    if (productFilter === 'all') {
      return rawData
    }
    const totalProfit = filteredItems.reduce((sum, item) => sum + item.profit, 0)
    const totalRevenue = filteredItems.reduce(
      (sum, item) => sum + item.sale_price * item.item_quantity,
      0
    )
    const totalCost = filteredItems.reduce(
      (sum, item) => sum + item.cost * item.item_quantity,
      0
    )
    // Average of each item's profit_margin (profit/cost × 100), same as table "Margen" column
    const margins = filteredItems
      .map((item) => item.profit_margin)
      .filter((m) => m != null && Number.isFinite(m))
    const averageProfitMargin =
      margins.length > 0
        ? margins.reduce((a, b) => a + b, 0) / margins.length
        : 0

    return {
      items: filteredItems,
      totalProfit,
      totalRevenue,
      totalCost,
      averageProfitMargin,
    }
  }, [filteredItems, productFilter, rawData])

  // Group data based on selected groupBy option
  const groupedData = useMemo(() => {
    if (groupBy === 'none' || !displayData.items.length) {
      return null
    }

    const groups = new Map<string, typeof displayData.items>()

    displayData.items.forEach((item) => {
      let key = ''
      switch (groupBy) {
        case 'date':
          key = item.sale_date || 'Sin fecha de venta'
          break
        case 'delivery_date':
          key = item.delivery_date || 'Sin fecha de entrega'
          break
        case 'product':
          key = item.item_name || 'Sin producto'
          break
        case 'customer':
          key = item.customer_name || 'Sin cliente'
          break
      }

      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(item)
    })

    // Convert to array and calculate subtotals
    return Array.from(groups.entries())
      .map(([key, items]) => {
        const subtotalProfit = items.reduce((sum, item) => sum + item.profit, 0)
        const subtotalRevenue = items.reduce(
          (sum, item) => sum + item.sale_price * item.item_quantity,
          0
        )
        const subtotalCost = items.reduce(
          (sum, item) => sum + item.cost * item.item_quantity,
          0
        )
        // Average of each item's profit_margin (profit/cost × 100), same as table "Margen" column
        const groupMargins = items
          .map((item) => item.profit_margin)
          .filter((m) => m != null && Number.isFinite(m))
        const subtotalMargin =
          groupMargins.length > 0
            ? groupMargins.reduce((a, b) => a + b, 0) / groupMargins.length
            : 0

        return {
          key,
          items,
          subtotalProfit,
          subtotalRevenue,
          subtotalCost,
          subtotalMargin,
        }
      })
      .sort((a, b) => {
        // Sort by key
        if (groupBy === 'date' || groupBy === 'delivery_date') {
          return b.key.localeCompare(a.key) // Most recent first
        }
        return a.key.localeCompare(b.key) // Alphabetical
      })
  }, [displayData.items, groupBy])

  const handleSearch = () => {
    setAppliedRange(range)
  }

  const handleRowClick = (item: typeof displayData.items[0]) => {
    if (item.item_type === 'service') return // Services have no inventory detail
    const itemId = item.product_item_id || item.accessory_item_id
    if (itemId) {
      setSelectedItemId(itemId)
      setSelectedItemType(item.item_type)
      if (item.item_type === 'product') {
        setDeviceModalOpen(true)
      } else {
        setAccessoryModalOpen(true)
      }
    }
  }

  const handleCloseModal = () => {
    setDeviceModalOpen(false)
    setAccessoryModalOpen(false)
    setSelectedItemId(null)
    setSelectedItemType(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  // Show skeleton on initial load
  if (isLoading && !data) {
    return <ProfitsSkeleton />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-red-500">
              Error al cargar ganancias: {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show empty state only if not loading and no data
  if (!data && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              No hay datos de ganancias disponibles
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-foreground">Ganancias</h1>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ganancia Total</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {isFetching ? (
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              ) : (
                formatCurrency(displayData.totalProfit)
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ingresos Totales</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {isFetching ? (
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              ) : (
                formatCurrency(displayData.totalRevenue)
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Costo Total</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {isFetching ? (
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              ) : (
                formatCurrency(displayData.totalCost)
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Margen Promedio</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {isFetching ? (
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              ) : (
                formatPercentage(displayData.averageProfitMargin)
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Profits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles de Ganancias</CardTitle>
          <CardDescription>
            Desglose detallado de ganancias por artículo vendido
          </CardDescription>
          <div className="flex flex-col gap-3 mt-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row gap-2">
              <DateRangePicker range={range} onRangeChange={setRange} />
              <Button onClick={handleSearch} disabled={isFetching}>
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  'Buscar'
                )}
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={productFilter}
                onValueChange={(value) => setProductFilter(value as ProductFilter)}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="new">Nuevos</SelectItem>
                  <SelectItem value="used">Usados</SelectItem>
                  <SelectItem value="accessory">Accesorios</SelectItem>
                  <SelectItem value="service">Servicios</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={groupBy}
                onValueChange={(value) => setGroupBy(value as GroupBy)}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Agrupar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin agrupar</SelectItem>
                  <SelectItem value="date">Fecha de Venta</SelectItem>
                  <SelectItem value="delivery_date">Fecha de Entrega</SelectItem>
                  <SelectItem value="product">Producto</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha de Venta</TableHead>
                  <TableHead>Fecha de Entrega</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Precio de Venta</TableHead>
                  <TableHead className="text-right">Ganancia</TableHead>
                  <TableHead className="text-right">Margen</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="w-0"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFetching && displayData.items.length === 0 ? (
                  // Show skeleton rows when fetching and no data
                  [1, 2, 3, 4, 5].map((row) => (
                    <TableRow key={row}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((cell) => (
                        <TableCell key={cell}>
                          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : displayData.items.length > 0 ? (
                  groupedData && groupBy !== 'none' ? (
                    // Render grouped data
                    groupedData.map((group, groupIndex) => (
                      <Fragment key={`group-${groupIndex}`}>
                        {/* Group Header Row */}
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableCell
                            colSpan={7}
                            className="font-bold text-base"
                          >
                            {groupBy === 'date'
                              ? `📅 ${format(
                                  parse(group.key, 'yyyy-MM-dd', new Date()),
                                  'dd/MM/yyyy'
                                )}`
                              : groupBy === 'delivery_date'
                                ? `🚚 ${
                                    group.key === 'Sin fecha de entrega'
                                      ? group.key
                                      : format(
                                          parse(
                                            group.key,
                                            'yyyy-MM-dd',
                                            new Date()
                                          ),
                                          'dd/MM/yyyy'
                                        )
                                  }`
                                : groupBy === 'product'
                                  ? `📦 ${group.key}`
                                  : `👤 ${group.key}`}
                            <span className="ml-2 text-sm text-muted-foreground font-normal">
                              ({group.items.length}{' '}
                              {group.items.length === 1
                                ? 'artículo'
                                : 'artículos'}
                              )
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            <StatsBadge
                              value={formatCurrency(group.subtotalProfit)}
                              isPositive={group.subtotalProfit > 0}
                            />
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            <StatsBadge
                              value={formatPercentage(group.subtotalMargin)}
                              isPositive={group.subtotalMargin > 0}
                            />
                          </TableCell>
                          <TableCell colSpan={3}></TableCell>
                        </TableRow>
                        {/* Group Items */}
                        {group.items.map((item) => (
                          <TableRow
                            key={item.id}
                            className={isFetching ? 'opacity-50' : ''}
                          >
                            <TableCell className="text-muted-foreground pl-8">
                              {format(
                                parse(item.sale_date, 'yyyy-MM-dd', new Date()),
                                'dd/MM/yyyy'
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground pl-8">
                              {item.delivery_date
                                ? format(
                                    parse(
                                      item.delivery_date,
                                      'yyyy-MM-dd',
                                      new Date()
                                    ),
                                    'dd/MM/yyyy'
                                  )
                                : '-'}
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.item_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="rounded-full">
                                {item.item_type === 'product'
                                  ? 'Producto'
                                  : item.item_type === 'service'
                                    ? 'Servicio'
                                    : 'Accesorio'}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.item_quantity}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(item.cost)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(item.sale_price)}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              <StatsBadge
                                value={formatCurrency(item.profit)}
                                isPositive={item.profit > 0}
                              />
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              <StatsBadge
                                value={formatPercentage(item.profit_margin)}
                                isPositive={item.profit_margin > 0}
                              />
                            </TableCell>
                            <TableCell>{item.customer_name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              <Badge variant="outline">
                                {item.seller_name}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {item.item_type !== 'service' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 p-0"
                                    >
                                      <span className="sr-only">
                                        Ver detalle de inventario
                                      </span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleRowClick(item)}
                                    >
                                      Ver detalle de inventario
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </Fragment>
                    ))
                  ) : (
                    // Render ungrouped data
                    displayData.items.map((item) => (
                      <TableRow
                        key={item.id}
                        className={isFetching ? 'opacity-50' : ''}
                      >
                        <TableCell className="text-muted-foreground">
                          {format(
                            parse(item.sale_date, 'yyyy-MM-dd', new Date()),
                            'dd/MM/yyyy'
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.delivery_date
                            ? format(
                                parse(
                                  item.delivery_date,
                                  'yyyy-MM-dd',
                                  new Date()
                                ),
                                'dd/MM/yyyy'
                              )
                            : '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.item_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-full">
                            {item.item_type === 'product'
                              ? 'Producto'
                              : item.item_type === 'service'
                                ? 'Servicio'
                                : 'Accesorio'}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.item_quantity}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.cost)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.sale_price)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          <StatsBadge
                            value={formatCurrency(item.profit)}
                            isPositive={item.profit > 0}
                          />
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          <StatsBadge
                            value={formatPercentage(item.profit_margin)}
                            isPositive={item.profit_margin > 0}
                          />
                        </TableCell>
                        <TableCell>{item.customer_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          <Badge variant="outline">{item.seller_name}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.item_type !== 'service' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0"
                                >
                                  <span className="sr-only">
                                    Ver detalle de inventario
                                  </span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleRowClick(item)}
                                >
                                  Ver detalle de inventario
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center text-muted-foreground py-8"
                    >
                      No hay datos disponibles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Device Item Form Modal */}
      {selectedItemType === 'product' && inventoryItem != null ? (
        <DeviceItemForm
          open={deviceModalOpen}
          onOpenChange={handleCloseModal}
          showTrigger={false}
          mode="edit"
          disabled={true}
          initialValues={(() => {
            const item = inventoryItem as ProductItemRow
            const usedItem = item.used_product_items?.[0]
            return {
              product_id: item.products?.id || '',
              search: item.products?.name || item.name || '',
              batch_id: item.batch_id || '',
              batchSearch: item.batchs?.name || '',
              name: item.name,
              color: item.color,
              storage: item.storage || '',
              price: item.price,
              wholesale_price: item.wholesale_price || 0,
              cost: item.cost,
              imei: item.imei || '',
              notes: item.notes || '',
              condition: usedItem ? 'used' : 'new',
              used_battery_health: usedItem?.battery_health,
              used_issues: usedItem?.issues?.join(', ') || '',
              used_fixes:
                usedItem?.fixes && Array.isArray(usedItem.fixes)
                  ? JSON.stringify(
                      usedItem.fixes.map((fix: unknown) => {
                        if (typeof fix === 'string') {
                          return JSON.parse(fix)
                        }
                        return fix
                      })
                    )
                  : '',
              is_on_sale: item.is_on_sale || false,
            }
          })()}
        />
      ) : null}

      {/* Accessory Item Form Modal */}
      {selectedItemType === 'accessory' && inventoryItem != null ? (
        <AccessoryItemForm
          open={accessoryModalOpen}
          onOpenChange={handleCloseModal}
          showTrigger={false}
          mode="edit"
          disabled={true}
          initialValues={(() => {
            const item = inventoryItem as AccessoryItemRow
            return {
              product_id: item.products?.id || '',
              search: item.products?.name || item.name || '',
              batch_id: item.batch_id || '',
              batchSearch: item.batchs?.name || '',
              name: item.name,
              color: item.color,
              cost: item.cost,
              price: item.price,
              wholesale_price: item.wholesale_price || 0,
              quantity: 1,
              notes: item.notes || '',
            }
          })()}
        />
      ) : null}
    </div>
  )
}

const ProfitsSkeleton = () => {
  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      {/* Summary Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Profits Table Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mb-4" />
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <div className="h-10 w-full sm:w-56 bg-muted animate-pulse rounded" />
            <div className="h-10 w-full sm:w-24 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                    <TableHead key={i}>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((row) => (
                  <TableRow key={row}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((cell) => (
                      <TableCell key={cell}>
                        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
