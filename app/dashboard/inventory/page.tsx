'use client'

import { useMemo, useState, useEffect } from 'react'
import { Input } from '@/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { Button } from '@/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/ui/alert-dialog'
import {
  useInventory,
  useSoftDeleteInventoryItems,
} from '@/lib/hooks/use-inventory'
import {
  List,
  Loader2,
  Plus,
  Search,
  Table as TableIcon,
  Trash,
} from 'lucide-react'
import { MultiSelect } from '@/ui/multi-select'
import AddDeviceBatchForm from '@/components/features/inventory/forms/device-batch-form'
import AddDeviceItemForm from '@/components/features/inventory/forms/device-item-form'
import AddAccessoryItemForm from '@/components/features/inventory/forms/accessory-item-form'
import type { InventoryRow } from '@/lib/types/inventory'
import InventoryView from '@/components/features/inventory/views/inventory-view'
import { useRouter } from 'next/navigation'
import { getUserProfile, canViewInventory } from '@/lib/auth/auth'
import { useAuth } from '@/components/providers/auth/auth-provider'
import type { UserProfile } from '@/lib/auth/auth'
import { toast } from 'sonner'
import { parseStorageToNumber } from '@/lib/utils/inventory'

const getProductSortKey = (row: InventoryRow) => {
  const name = (row.products?.model || row.name || '').toLowerCase()
  const releaseValue = row.products?.release_date
  const orderValue = row.products?.order

  const hasReleaseAndOrder =
    Boolean(releaseValue) &&
    typeof orderValue === 'number' &&
    Number.isFinite(orderValue)

  if (hasReleaseAndOrder) {
    const parsedRelease = new Date(releaseValue!)
    if (Number.isNaN(parsedRelease.getTime())) {
      // Invalid date, fall back to name-only sorting
      return `1|${name}`
    }

    const normalizedRelease = parsedRelease.toISOString().slice(0, 10)
    const normalizedOrder = Math.abs(orderValue!).toString().padStart(6, '0')
    const sign = orderValue! >= 0 ? '+' : '-'

    return `0|${normalizedRelease}|${sign}${normalizedOrder}|${name}`
  }

  return `1|${name}`
}

type SortColumn = { column: string; direction: 'asc' | 'desc' }

const sortRowsByColumns = (
  list: InventoryRow[],
  sortColumns: SortColumn[]
): InventoryRow[] => {
  if (sortColumns.length === 0) return list
  const sorted = [...list]
  sorted.sort((a, b) => {
    for (const { column, direction } of sortColumns) {
      let aValue: string | number
      let bValue: string | number

      switch (column) {
        case 'product':
          aValue = getProductSortKey(a)
          bValue = getProductSortKey(b)
          break
        case 'color':
          aValue = a.color || ''
          bValue = b.color || ''
          break
        case 'storage':
          aValue = a.storage || ''
          bValue = b.storage || ''
          break
        case 'batch_name':
          aValue = a.batch_name || ''
          bValue = b.batch_name || ''
          break
        case 'type':
          aValue = a.products?.type || ''
          bValue = b.products?.type || ''
          break
        case 'imei':
          aValue = a.imei || ''
          bValue = b.imei || ''
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        case 'condition':
          aValue = a.condition || ''
          bValue = b.condition || ''
          break
        case 'created_at':
          aValue = new Date(a.created_at || 0).getTime()
          bValue = new Date(b.created_at || 0).getTime()
          break
        case 'quantity':
          aValue = ('quantity' in a ? a.quantity : 0) || 0
          bValue = ('quantity' in b ? b.quantity : 0) || 0
          break
        case 'cost':
          aValue = ('cost' in a ? (a.cost as number) : 0) || 0
          bValue = ('cost' in b ? (b.cost as number) : 0) || 0
          break
        case 'price':
          aValue = a.price || 0
          bValue = b.price || 0
          break
        case 'trade_in_customer_name':
          aValue = a.trade_in_customer_name || ''
          bValue = b.trade_in_customer_name || ''
          break
        case 'created_by_full_name':
          aValue = a.created_by_full_name || ''
          bValue = b.created_by_full_name || ''
          break
        case 'battery_health':
          aValue = a.battery_health ?? 0
          bValue = b.battery_health ?? 0
          break
        case 'used_fixes':
          aValue = a.total_fix_cost ?? 0
          bValue = b.total_fix_cost ?? 0
          break
        case 'wholesale_price':
          aValue = a.wholesale_price ?? 0
          bValue = b.wholesale_price ?? 0
          break
        case 'notes':
          aValue = a.notes || ''
          bValue = b.notes || ''
          break
        case 'cost_total': {
          const aCost = ('cost' in a ? (a.cost as number) : 0) ?? 0
          const bCost = ('cost' in b ? (b.cost as number) : 0) ?? 0
          aValue = aCost + (a.total_fix_cost ?? 0)
          bValue = bCost + (b.total_fix_cost ?? 0)
          break
        }
        default:
          continue
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue)
        if (comparison !== 0) {
          return direction === 'asc' ? comparison : -comparison
        }
      } else {
        if (aValue < bValue) return direction === 'asc' ? -1 : 1
        if (aValue > bValue) return direction === 'asc' ? 1 : -1
      }
    }
    return 0
  })
  return sorted
}

export default function InventoryPage() {
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

      if (!canViewInventory(userProfile)) {
        router.push('/dashboard')
        return
      }
    }

    checkAccess()
  }, [user, router])

  const { data: items = [] } = useInventory()
  const softDelete = useSoftDeleteInventoryItems()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'new' | 'used' | 'accessories'>('all')
  const [openBatch, setOpenBatch] = useState(false)
  const [openDevice, setOpenDevice] = useState(false)
  const [openAccessory, setOpenAccessory] = useState(false)
  const [view, setView] = useState<'list' | 'table'>('table')
  const [groupBy, setGroupBy] = useState<string[]>([])
  const [sortColumns, setSortColumns] = useState<SortColumn[]>([])
  const [sortColumnsByGroup, setSortColumnsByGroup] = useState<
    Record<string, SortColumn[]>
  >({})
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedSaleFilters, setSelectedSaleFilters] = useState<string[]>([])
  // Local state to force re-renders when selection changes
  // (since we're mutating the row.checked property directly)
  const [updateCounter, setUpdateCounter] = useState(0)
  const forceUpdate = () => setUpdateCounter((prev) => prev + 1)

  const groupByOptions = [
    { label: 'Producto', value: 'product' },
    { label: 'Almacenamiento', value: 'storage' },
    { label: 'Color', value: 'color' },
    { label: 'Lote', value: 'batch' },
  ]

  const statusOptions = [
    { label: 'Disponible', value: 'available' },
    { label: 'Reservado', value: 'reserved' },
    { label: 'En Reparación', value: 'in-repair' },
    { label: 'Perdido', value: 'lost' },
    { label: 'Despiece', value: 'spare' },
    { label: 'Vendido', value: 'sold' },
  ]

  const saleOptions = [
    { label: 'Es Oferta', value: 'on-sale' },
    { label: 'No es Oferta', value: 'not-on-sale' },
  ]

  const handleColumnSort = (column: string, groupKey?: string) => {
    const updateSort = (prev: SortColumn[]): SortColumn[] => {
      const existingIndex = prev.findIndex((item) => item.column === column)
      if (existingIndex !== -1) {
        const newColumns = [...prev]
        newColumns[existingIndex] = {
          ...newColumns[existingIndex],
          direction:
            newColumns[existingIndex].direction === 'asc' ? 'desc' : 'asc',
        }
        return newColumns
      }
      return [...prev, { column, direction: 'asc' as const }]
    }

    if (groupKey !== undefined) {
      setSortColumnsByGroup((prev) => ({
        ...prev,
        [groupKey]: updateSort(prev[groupKey] ?? []),
      }))
    } else {
      setSortColumns(updateSort)
    }
  }

  const removeSortColumn = (column: string, groupKey?: string) => {
    if (groupKey !== undefined) {
      setSortColumnsByGroup((prev) => {
        const next = prev[groupKey]?.filter((item) => item.column !== column)
        if (!next?.length) {
          const { [groupKey]: _, ...rest } = prev
          return rest
        }
        return { ...prev, [groupKey]: next }
      })
    } else {
      setSortColumns((prev) => prev.filter((item) => item.column !== column))
    }
  }

  const filtered = useMemo(() => {
    const typedItems = items as unknown as InventoryRow[]
    let list = typedItems.filter((it) => {
      if (!search.trim()) return true

      const imei = it.imei || ''
      const model = it.products?.model || ''
      const name = it.name || ''
      const color = it.color || ''
      const storage = it.storage || ''
      const batchName = it.batch_name || ''
      const needle = search.toLowerCase().trim()

      // IMEI: allow partial match only when search has 3+ chars, so "11" matches iPhone 11 not IMEIs containing "11"
      if (needle.length >= 3 && imei && imei.toLowerCase().includes(needle))
        return true

      // Rest of fields: smart word-boundary matching for model names
      const textHaystack =
        `${model} ${name} ${color} ${storage} ${batchName}`.toLowerCase()

      // Escape special regex characters
      const escapedNeedle = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      // Smart matching: use word boundaries with negative lookahead
      // This ensures:
      // - "14" matches "iPhone 14" but NOT "iPhone 14 Pro", "iPhone 14 Pro Max", "iPhone 14 mini", "iPhone 14 SE", etc.
      // - "14 Pro" matches "iPhone 14 Pro" but NOT "iPhone 14 Pro Max"
      // - "14 Pro Max" matches "iPhone 14 Pro Max"
      // - "13 mini" matches "iPhone 13 mini" but NOT "iPhone 13 mini Pro"
      // - "iPad Air" matches "iPad Air" but NOT "iPad Air Pro"

      let regexPattern = `\\b${escapedNeedle}\\b`

      // If search ends with a number (like "14"), exclude matches followed by " Pro", " mini", " air", or " se"
      if (/\d+$/.test(needle)) {
        regexPattern = `\\b${escapedNeedle}\\b(?!\\s+(?:pro|mini|air|se|plus))`
      }
      // If search ends with "Pro" (like "14 Pro"), exclude matches followed by " Max"
      else if (/\bpro$/i.test(needle)) {
        regexPattern = `\\b${escapedNeedle}\\b(?!\\s+max)`
      }
      // If search ends with "mini", "air", or "se", exclude matches followed by " Pro" or " Max"
      else if (/\b(mini|air|se|plus)$/i.test(needle)) {
        regexPattern = `\\b${escapedNeedle}\\b(?!\\s+(?:pro|max))`
      }

      const regex = new RegExp(regexPattern, 'i')
      return regex.test(textHaystack)
    })

    if (tab === 'new')
      list = list.filter(
        (i) => i.table === 'product_items' && i.condition === 'new'
      )
    if (tab === 'used')
      list = list.filter(
        (i) => i.table === 'used_product_items' && i.condition === 'used'
      )
    if (tab === 'accessories')
      list = list.filter((i) => i.table === 'accessory_items')

    // Filter by status
    if (selectedStatuses.length > 0) {
      list = list.filter((i) => selectedStatuses.includes(i.status || ''))
    }

    // Filter by technicians
    if (
      selectedTechnicians.length > 0 &&
      selectedStatuses.includes('in-repair')
    ) {
      list = list.filter((i) => {
        const technician = i.technician?.toLowerCase() || ''
        return selectedTechnicians.includes(technician)
      })
    }

    // Filter by sale status
    if (selectedSaleFilters.length > 0) {
      list = list.filter((i) => {
        const isOnSale = i.is_on_sale === true
        if (selectedSaleFilters.includes('on-sale') && isOnSale) {
          return true
        }
        if (selectedSaleFilters.includes('not-on-sale') && !isOnSale) {
          return true
        }
        return false
      })
    }

    // Apply sorting only when not grouped (per-group sort is applied in grouped)
    if (groupBy.length === 0 && sortColumns.length > 0) {
      list = sortRowsByColumns(list, sortColumns)
    }

    return list
  }, [
    items,
    search,
    tab,
    groupBy,
    sortColumns,
    selectedTechnicians,
    selectedStatuses,
    selectedSaleFilters,
  ])

  // Get unique technicians from items in repair status
  const technicians = useMemo(() => {
    const typedItems = items as unknown as InventoryRow[]
    const repairItems = typedItems.filter((i) => i.status === 'in-repair')
    const uniqueTechnicians = new Set<string>()

    repairItems.forEach((item) => {
      if (item.technician) {
        uniqueTechnicians.add(item.technician.toLowerCase())
      }
    })

    // Convert to options format for MultiSelect with proper capitalization
    return Array.from(uniqueTechnicians)
      .sort()
      .map((tech) => ({
        label: tech.charAt(0).toUpperCase() + tech.slice(1),
        value: tech,
      }))
  }, [items])

  const grouped = useMemo(() => {
    if (groupBy.length === 0)
      return [] as Array<{ key: string; rows: InventoryRow[] }>

    const keyFn = (row: InventoryRow) => {
      return groupBy
        .map((field) => {
          switch (field) {
            case 'product':
              return row.products?.model || row.name || 'SIN MODELO'
            case 'storage':
              return row.storage || 'SIN ALMACENAMIENTO'
            case 'color':
              return row.color || 'SIN COLOR'
            case 'batch':
              return row.batch_name || 'SIN LOTE'
            default:
              return 'SIN GRUPO'
          }
        })
        .join(' | ')
    }

    const map = new Map<string, InventoryRow[]>()
    for (const r of filtered) {
      const k = keyFn(r)
      const arr = map.get(k) || []
      arr.push(r)
      map.set(k, arr)
    }

    const entries = Array.from(map.entries()).map(([key, rows]) => {
      const groupSort = sortColumnsByGroup[key]
      const sortedRows =
        groupSort && groupSort.length > 0
          ? sortRowsByColumns(rows, groupSort)
          : rows
      return { key, rows: sortedRows }
    })

    // Sort groups so product order is consistent and storage is always smallest → largest
    const keySeparator = ' | '
    entries.sort((a, b) => {
      const aParts = a.key.split(keySeparator)
      const bParts = b.key.split(keySeparator)
      for (let i = 0; i < groupBy.length; i++) {
        const field = groupBy[i]
        const aVal = aParts[i] ?? ''
        const bVal = bParts[i] ?? ''
        if (field === 'storage') {
          const aNum = parseStorageToNumber(aVal)
          const bNum = parseStorageToNumber(bVal)
          if (aNum !== bNum) return aNum - bNum
        } else if (field === 'product') {
          const aSort = getProductSortKey(a.rows[0])
          const bSort = getProductSortKey(b.rows[0])
          const cmp = aSort.localeCompare(bSort)
          if (cmp !== 0) return cmp
        } else {
          const cmp = (aVal || '').localeCompare(bVal || '')
          if (cmp !== 0) return cmp
        }
      }
      return 0
    })

    return entries
  }, [filtered, groupBy, sortColumnsByGroup])

  const selectedRows = useMemo(() => {
    return filtered.filter((row) => row.checked === true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, updateCounter])

  const isSelected = selectedRows.length > 0

  const handleDeleteSelected = () => {
    const soldOrReservedItems = selectedRows.some(
      (row) => row.status === 'sold' || row.status === 'reserved'
    )
    if (soldOrReservedItems) {
      toast.error('No es posible eliminar artículos vendidos o reservados')
      return
    }

    softDelete.mutate({
      items: selectedRows.map((row) => ({
        id: row.id,
        table: row.table as
          | 'product_items'
          | 'accessory_items'
          | 'used_product_items',
      })),
    })
    selectedRows.forEach((row) => {
      row.checked = false
    })
    forceUpdate()
  }

  if (!user || !profile || !canViewInventory(profile)) {
    return null
  }

  return (
    <div className="calc-container">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Inventario</h1>
            <p className="text-muted-foreground">
              Gestión de stock de productos
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Agregar inventario</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <button
                    type="button"
                    className="w-full"
                    onClick={() => setOpenBatch(true)}
                  >
                    Lote de dispositivos
                  </button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <button
                    type="button"
                    className="w-full"
                    onClick={() => setOpenDevice(true)}
                  >
                    Dispositivo individual
                  </button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <button
                    type="button"
                    className="w-full"
                    onClick={() => setOpenAccessory(true)}
                  >
                    Accesorio
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AddDeviceBatchForm
              showTrigger={false}
              open={openBatch}
              onOpenChange={setOpenBatch}
            />
            <AddDeviceItemForm
              showTrigger={false}
              open={openDevice}
              onOpenChange={setOpenDevice}
            />
            <AddAccessoryItemForm
              showTrigger={false}
              open={openAccessory}
              onOpenChange={setOpenAccessory}
            />
          </div>
        </div>

        <div className="rounded-lg border p-6 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por modelo, nombre, color..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
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

        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as 'all' | 'new' | 'used' | 'accessories')
          }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-between flex-wrap">
            <TabsList className="grid w-full max-w-xl grid-cols-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="new">Nuevos</TabsTrigger>
              <TabsTrigger value="used">Usados</TabsTrigger>
              <TabsTrigger value="accessories">Accesorios</TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap gap-2 min-w-0">
              <MultiSelect
                options={groupByOptions}
                selected={groupBy}
                onChange={setGroupBy}
                placeholder="Agrupar por..."
                hideLabels
                hideSearch
                isGroupOrOrder
              />
              <MultiSelect
                options={statusOptions}
                selected={selectedStatuses}
                onChange={setSelectedStatuses}
                placeholder="Filtrar por estado"
                hideLabels
                hideSearch
              />
              <MultiSelect
                options={saleOptions}
                selected={selectedSaleFilters}
                onChange={setSelectedSaleFilters}
                placeholder="Filtrar por oferta"
                hideLabels
                hideSearch
              />
              {selectedStatuses.includes('in-repair') &&
                technicians.length > 0 && (
                  <MultiSelect
                    options={technicians}
                    selected={selectedTechnicians}
                    onChange={setSelectedTechnicians}
                    placeholder="Filtrar por técnico"
                    hideLabels
                    hideSearch
                  />
                )}
            </div>
          </div>

          {isSelected && (
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={!isSelected || softDelete.isPending}
                  >
                    {softDelete.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash className="h-4 w-4 mr-2" />
                    )}
                    Eliminar filas seleccionadas
                    {selectedRows.length > 0 && ` (${selectedRows.length})`}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Estás seguro de que deseas eliminar{' '}
                      {selectedRows.length === 1
                        ? 'este artículo'
                        : `estos ${selectedRows.length} artículos`}
                      ?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteSelected}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          <TabsContent value="all">
            <InventoryView
              data={filtered}
              groupedData={grouped}
              groupBy={groupBy}
              view={view}
              sortColumns={sortColumns}
              sortColumnsByGroup={sortColumnsByGroup}
              onColumnSort={handleColumnSort}
              onRemoveSortColumn={removeSortColumn}
              forceUpdate={forceUpdate}
            />
          </TabsContent>
          <TabsContent value="new">
            <InventoryView
              data={filtered}
              groupedData={grouped}
              groupBy={groupBy}
              view={view}
              sortColumns={sortColumns}
              sortColumnsByGroup={sortColumnsByGroup}
              onColumnSort={handleColumnSort}
              onRemoveSortColumn={removeSortColumn}
              forceUpdate={forceUpdate}
            />
          </TabsContent>
          <TabsContent value="used">
            <InventoryView
              data={filtered}
              groupedData={grouped}
              groupBy={groupBy}
              view={view}
              sortColumns={sortColumns}
              sortColumnsByGroup={sortColumnsByGroup}
              onColumnSort={handleColumnSort}
              onRemoveSortColumn={removeSortColumn}
              forceUpdate={forceUpdate}
            />
          </TabsContent>
          <TabsContent value="accessories">
            <InventoryView
              data={filtered}
              groupedData={grouped}
              groupBy={groupBy}
              view={view}
              sortColumns={sortColumns}
              sortColumnsByGroup={sortColumnsByGroup}
              onColumnSort={handleColumnSort}
              onRemoveSortColumn={removeSortColumn}
              forceUpdate={forceUpdate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
