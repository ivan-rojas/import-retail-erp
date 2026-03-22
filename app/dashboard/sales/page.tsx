'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'
import { List, Table as TableIcon, Loader2, Plus } from 'lucide-react'
import { useSales } from '@/lib/hooks/use-sales'
import SalesForm from '@/components/features/sales/forms/sales-form'
import SalesList from '@/components/features/sales/views/sales-list'
import SalesTable from '@/components/features/sales/views/sales-table'
import SalesStatsCards from '@/components/features/sales/views/sales-stats-cards'
import SalesFilters from '@/components/features/sales/views/sales-filters'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import {
  canSell,
  getUserProfile,
  isAdmin,
  type UserProfile,
} from '@/lib/auth/auth'
import { useAuth } from '@/components/providers/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { DateRange } from 'react-day-picker'
import {
  startOfDay,
  endOfDay,
  isWithinInterval,
  parseISO,
  subDays,
} from 'date-fns'

export default function SalesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      const userProfile = await getUserProfile()
      setProfile(userProfile)

      if (!canSell(userProfile)) {
        router.push('/dashboard')
        return
      }
    }

    checkAccess()
  }, [user, router])

  const { data: sales = [], isLoading: salesLoading } = useSales()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<
    'all' | 'cash' | 'transfer' | 'crypto'
  >('all')
  const [view, setView] = useState<'list' | 'table'>('table')
  const [tab, setTab] = useState<'all' | 'sold' | 'reserved' | 'deleted'>('all')
  const [openSale, setOpenSale] = useState(false)
  const [isReservation, setIsReservation] = useState(false)
  const [orderBy, setOrderBy] = useState<
    'sale_date' | 'created_at' | 'delivery_date'
  >('sale_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [range, setRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })

  const filteredSales = useMemo(() => {
    // First, filter the sales
    const filtered = sales.filter((sale) => {
      const searchLower = searchTerm.toLowerCase()
      const matchesAnyImei =
        sale?.sale_items?.some((item) =>
          item?.product_items?.imei?.toLowerCase().includes(searchLower)
        ) ?? false
      const matchesSearch =
        sale?.customer_name?.toLowerCase().includes(searchLower) ||
        sale?.product_name?.toLowerCase().includes(searchLower) ||
        matchesAnyImei ||
        sale?.customer_phone?.toLowerCase().includes(searchLower) ||
        sale?.customer_email?.toLowerCase().includes(searchLower) ||
        sale?.customer_ig?.toLowerCase().includes(searchLower)

      // Get the date field based on orderBy selection
      const dateField =
        orderBy === 'sale_date'
          ? sale?.sale_date
          : orderBy === 'created_at'
            ? sale?.created_at
            : sale?.delivery_date

      const matchesDate =
        range?.from && range?.to && dateField
          ? isWithinInterval(parseISO(dateField), {
              start: startOfDay(range.from),
              end: endOfDay(range.to),
            })
          : true

      const matchesStatus =
        filterPaymentMethod === 'all' ||
        sale?.payment_method === filterPaymentMethod

      const matchesTab = tab === 'all' || sale.status === tab

      return matchesSearch && matchesStatus && matchesTab && matchesDate
    })

    // Then, sort the filtered results
    return filtered.sort((a, b) => {
      let aValue: string | null | undefined
      let bValue: string | null | undefined

      if (orderBy === 'sale_date') {
        aValue = a.sale_date
        bValue = b.sale_date
      } else if (orderBy === 'created_at') {
        aValue = a.created_at
        bValue = b.created_at
      } else {
        // delivery_date
        aValue = a.delivery_date
        bValue = b.delivery_date
      }

      // Handle null/undefined values - put them at the end
      if (!aValue && !bValue) return 0
      if (!aValue) return 1
      if (!bValue) return -1

      // Compare dates
      const aDate = new Date(aValue).getTime()
      const bDate = new Date(bValue).getTime()

      // Handle invalid dates
      if (isNaN(aDate) && isNaN(bDate)) return 0
      if (isNaN(aDate)) return 1
      if (isNaN(bDate)) return -1

      if (sortDirection === 'asc') {
        return aDate - bDate
      } else {
        return bDate - aDate
      }
    })
  }, [
    sales,
    searchTerm,
    filterPaymentMethod,
    tab,
    orderBy,
    sortDirection,
    range,
  ])

  const totalSales = filteredSales.filter(
    (sale) => sale.status === 'sold'
  ).length
  const totalRevenue = filteredSales
    .filter((sale) => sale.status === 'sold')
    .reduce((sum, sale) => {
      const saleAmount =
        // Prefer a computed total if present, otherwise fall back to sale_price
        (sale as any).total_price ?? sale.sale_price ?? 0
      return sum + saleAmount
    }, 0)
  const pendingReservations = filteredSales.filter(
    (sale) => sale.status === 'reserved'
  ).length

  if (salesLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando ventas...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile || !canSell(profile)) {
    return null
  }

  return (
    <div className="calc-container">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground">Ventas</h1>
              <p className="text-muted-foreground">
                Registra ventas y reservas de productos
              </p>
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" /> Nueva
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setIsReservation(false)
                      setOpenSale(true)
                    }}
                  >
                    Venta
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsReservation(true)
                      setOpenSale(true)
                    }}
                  >
                    Reserva
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Controlled dialogs */}
          <SalesForm
            open={openSale}
            onOpenChange={setOpenSale}
            showTrigger={false}
            isReservation={isReservation}
          />
        </div>

        {/* Stats Cards */}
        <SalesStatsCards
          totalSales={totalSales}
          totalRevenue={totalRevenue}
          pendingReservations={pendingReservations}
        />

        {/* Filters and View Toggle */}
        <div className="bg-background rounded-lg border border-border p-6 mb-6">
          <div className="flex flex-col gap-4">
            <SalesFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterPaymentMethod={filterPaymentMethod}
              onFilterPaymentMethodChange={setFilterPaymentMethod}
              orderBy={orderBy}
              onOrderByChange={setOrderBy}
              sortDirection={sortDirection}
              onSortDirectionChange={setSortDirection}
              range={range}
              onRangeChange={setRange}
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                type="button"
                variant={view === 'table' ? 'default' : 'outline'}
                onClick={() => setView('table')}
              >
                <TableIcon className="h-4 w-4 mr-2" /> Tabla
              </Button>
              <Button
                type="button"
                variant={view === 'list' ? 'default' : 'outline'}
                onClick={() => setView('list')}
              >
                <List className="h-4 w-4 mr-2" /> Lista
              </Button>
            </div>
          </div>
        </div>

        {/* Sales Content */}
        <Tabs
          value={tab}
          onValueChange={(v) =>
            setTab(v as 'all' | 'sold' | 'reserved' | 'deleted')
          }
          className="space-y-6"
        >
          <TabsList
            className={
              isAdmin(profile)
                ? 'grid w-full max-w-xl grid-cols-2 sm:grid-cols-4'
                : 'grid w-full max-w-xl grid-cols-2 sm:grid-cols-3'
            }
          >
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="sold">Vendidas</TabsTrigger>
            <TabsTrigger value="reserved">Reservadas</TabsTrigger>
            {isAdmin(profile) && (
              <TabsTrigger value="deleted">Eliminadas</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all">
            {view === 'list' ? (
              <SalesList data={filteredSales} />
            ) : (
              <SalesTable data={filteredSales} />
            )}
          </TabsContent>
          <TabsContent value="sold">
            {view === 'list' ? (
              <SalesList data={filteredSales} />
            ) : (
              <SalesTable data={filteredSales} />
            )}
          </TabsContent>
          <TabsContent value="reserved">
            {view === 'list' ? (
              <SalesList data={filteredSales} />
            ) : (
              <SalesTable data={filteredSales} />
            )}
          </TabsContent>
          {isAdmin(profile) && (
            <TabsContent value="deleted">
              {view === 'list' ? (
                <SalesList data={filteredSales} />
              ) : (
                <SalesTable data={filteredSales} />
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
