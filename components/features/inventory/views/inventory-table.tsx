'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Badge } from '@/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import { ScrollArea, ScrollBar } from '@/ui/scroll-area'
import type { InventoryRow } from '@/lib/types/inventory'
import { AlertCircle } from 'lucide-react'
import InventoryNoProducts from './inventory-no-products'
import InventoryActionButtons from './inventory-action-buttons'
import { format } from 'date-fns'
import { Checkbox } from '@/ui/checkbox'
import SortableTableHead from './shared/sortable-table-head'
import InventoryStatusBadge from '@/components/features/inventory/shared/inventory-status-badge'
import InventoryTypeBadge from '../shared/inventory-type-badge'
import InventoryConditionBadge from '../shared/inventory-condition-badge'
import InventoryIsOnSaleBadge from '../shared/inventory-is-on-sale-badge'
import { ItemStatus } from '@/lib/enums'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

const formatCurrency = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined) return '-'
  const num =
    typeof amount === 'string' ? Number.parseFloat(amount) : (amount as number)

  if (Number.isNaN(num)) return '-'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

interface InventoryTableProps {
  data: InventoryRow[]
  hideActions?: boolean
  sortColumns?: Array<{ column: string; direction: 'asc' | 'desc' }>
  onColumnSort?: (column: string) => void
  onRemoveSortColumn?: (column: string) => void
  forceUpdate: () => void
}
export default function InventoryTable({
  data,
  hideActions = false,
  sortColumns,
  onColumnSort,
  onRemoveSortColumn,
  forceUpdate,
}: InventoryTableProps) {
  // Local counter to track when to recalculate
  // This ensures allSelected updates when forceUpdate is called
  const [localUpdate, setLocalUpdate] = useState(0)
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null)
  const [focusedRowKey, setFocusedRowKey] = useState<string | null>(null)
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map())
  const tableRef = useRef<HTMLTableElement>(null)

  const localForceUpdate = useCallback(() => {
    forceUpdate()
    setLocalUpdate((prev) => prev + 1)
  }, [forceUpdate])

  // Helper function to get unique key for a row
  const getRowKey = (row: InventoryRow) => `${row.table}-${row.id}`

  // Check if all rows are selected
  // We calculate this on every render since we're mutating row.checked
  // The localUpdate counter ensures recalculation when selections change
  const allSelected = useMemo(() => {
    if (data.length === 0) return false
    // Check the current state of all rows
    return data.every((row) => Boolean(row.checked))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, localUpdate])

  // Handle individual row checkbox toggle
  const handleRowToggle = useCallback(
    (row: InventoryRow) => {
      row.checked = !row.checked
      localForceUpdate()
    },
    [localForceUpdate]
  )

  // Handle check all / uncheck all
  const handleCheckAll = useCallback(
    (checked: boolean) => {
      data.forEach((row) => {
        row.checked = checked
      })
      localForceUpdate()
    },
    [data, localForceUpdate]
  )

  // Handle keyboard navigation with Arrow Up/Down (with or without Shift)
  useEffect(() => {
    const tableElement = tableRef.current
    if (!tableElement || hideActions) {
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Arrow Up or Down
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
        return
      }

      // Only proceed if we have rows
      if (data.length === 0) {
        return
      }

      // Check that the active element is inside the table
      if (
        !document.activeElement ||
        !tableElement.contains(document.activeElement)
      ) {
        return
      }

      e.preventDefault()

      let newIndex: number

      if (focusedRowIndex === null) {
        // If no row is focused, start from the first row
        newIndex = e.key === 'ArrowDown' ? 0 : data.length - 1
      } else {
        // Move to next or previous row
        if (e.key === 'ArrowDown') {
          newIndex = Math.min(focusedRowIndex + 1, data.length - 1)
        } else {
          newIndex = Math.max(focusedRowIndex - 1, 0)
        }
      }

      // If Shift is pressed, toggle the row at the resolved index
      if (e.shiftKey) {
        handleRowToggle(data[newIndex])
      }

      // Update focused row index and focus the row
      const newKey = getRowKey(data[newIndex])
      setFocusedRowIndex(newIndex)
      setFocusedRowKey(newKey)
      rowRefs.current.get(newKey)?.focus()
    }

    tableElement.addEventListener('keydown', handleKeyDown)
    return () => tableElement.removeEventListener('keydown', handleKeyDown)
  }, [data, focusedRowIndex, hideActions, handleRowToggle])

  useEffect(() => {
    if (hideActions) return

    const tableElement = tableRef.current
    if (!tableElement) return

    const activeElement = document.activeElement as HTMLElement | null
    const isActiveInsideTable =
      !!activeElement && tableElement.contains(activeElement)
    let currentKey = focusedRowKey

    if (isActiveInsideTable) {
      for (const [key, rowEl] of rowRefs.current.entries()) {
        if (rowEl === activeElement || rowEl.contains(activeElement)) {
          currentKey = key
          break
        }
      }
    }

    if (!currentKey) {
      if (focusedRowIndex !== null) {
        setFocusedRowIndex(null)
      }
      return
    }

    const newIndex = data.findIndex((row) => getRowKey(row) === currentKey)

    if (newIndex === -1) {
      if (focusedRowIndex !== null) {
        setFocusedRowIndex(null)
      }
      if (focusedRowKey !== null) {
        setFocusedRowKey(null)
      }
      return
    }

    if (newIndex !== focusedRowIndex) {
      setFocusedRowIndex(newIndex)
    }

    if (currentKey !== focusedRowKey) {
      setFocusedRowKey(currentKey)
    }

    const rowEl = rowRefs.current.get(currentKey)
    if (rowEl && rowEl !== document.activeElement && isActiveInsideTable) {
      rowEl.focus()
    }
  }, [data, hideActions, focusedRowIndex, focusedRowKey])

  if (!data.length) {
    return <InventoryNoProducts allProducts={data} />
  }

  return (
    <ScrollArea>
      <Table ref={tableRef} className="table-fixed min-w-[1000px]">
        <colgroup>
          {!hideActions && <col className="w-[50px]" />}
          <col className="w-[300px]" />
          <col className="w-[160px]" />
          <col className="w-[160px]" />
          <col className="w-[100px]" />
          <col className="w-[250px]" />
          <col className="w-[200px]" />
          <col className="w-[120px]" />
          <col className="w-[130px]" />
          <col className="w-[140px]" />
          <col className="w-[200px]" />
          <col className="w-[80px]" />
          <col className="w-[160px]" />
          <col className="w-[100px]" />
          <col className="w-[200px]" />
          <col className="w-[120px]" />
          <col className="w-[120px]" />
          <col className="w-[120px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          {!hideActions && <col className="w-[60px]" />}
        </colgroup>
        <TableHeader>
          <TableRow>
            {!hideActions && (
              <TableHead aria-label="Seleccionar todos" className="px-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleCheckAll}
                />
              </TableHead>
            )}
            <SortableTableHead
              column="product"
              label="Producto"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
            />
            <SortableTableHead
              column="storage"
              label="Almacenamiento"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
            />
            <SortableTableHead
              column="color"
              label="Color"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
            />
            <SortableTableHead
              column="battery_health"
              label="Batería"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
            />
            <SortableTableHead
              column="notes"
              label="Detalles"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
            />
            <SortableTableHead
              column="imei"
              label="IMEI"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
            />
            <SortableTableHead
              column="cost_total"
              label="Costo Total"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
              className="text-right"
            />
            <SortableTableHead
              column="cost"
              label="Costo Equipo"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
              className="text-right"
            />
            <SortableTableHead
              column="used_fixes"
              label="Costo Arreglos"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
              className="text-right"
            />
            <SortableTableHead
              column="trade_in_customer_name"
              label="Cliente (Parte Pago)"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
            />
            <SortableTableHead
              column="price"
              label="Precio"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
              className="text-right"
            />
            <SortableTableHead
              column="wholesale_price"
              label="Precio Mayorista"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
              className="text-right"
            />
            <SortableTableHead
              column="quantity"
              label="Cantidad"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
              className="text-right"
            />
            <SortableTableHead
              column="batch_name"
              label="Lote"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
            />
            <SortableTableHead
              column="condition"
              label="Condición"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
            />
            <SortableTableHead
              column="status"
              label="Estado"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
            />
            <SortableTableHead
              column="type"
              label="Tipo"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
            />
            <SortableTableHead
              column="created_at"
              label="Fecha Ingreso"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
            />
            <SortableTableHead
              column="created_by_full_name"
              label="Creado por"
              sortColumns={sortColumns}
              onColumnSort={onColumnSort}
              onRemoveSortColumn={onRemoveSortColumn}
            />
            {!hideActions && (
              <TableHead className="text-right px-3"></TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => {
            const rowKey = getRowKey(row)
            return (
              <TableRow
                key={rowKey}
                ref={(el) => {
                  if (el) {
                    rowRefs.current.set(rowKey, el)
                  } else {
                    rowRefs.current.delete(rowKey)
                  }
                }}
                data-row-key={rowKey}
                tabIndex={hideActions ? -1 : 0}
                onFocus={() => {
                  if (hideActions) return
                  setFocusedRowIndex(index)
                  setFocusedRowKey(rowKey)
                }}
                onKeyDown={(e) => {
                  if (hideActions) return
                  // Handle Space key to toggle checkbox
                  if (e.key === ' ') {
                    // Don't handle spacebar if user is typing in a form field
                    const target = e.target as HTMLElement
                    const isFormElement =
                      target.tagName === 'INPUT' ||
                      target.tagName === 'TEXTAREA' ||
                      target.tagName === 'SELECT' ||
                      target.isContentEditable ||
                      target.closest('[role="dialog"]') !== null ||
                      target.closest('[role="combobox"]') !== null

                    if (!isFormElement) {
                      e.preventDefault()
                      handleRowToggle(row)
                    }
                  }
                }}
              >
                {!hideActions && (
                  <TableCell className="px-3">
                    <Checkbox
                      checked={row.checked === true}
                      onCheckedChange={() => handleRowToggle(row)}
                      aria-label={`Seleccionar ${
                        row.products?.model || row.name
                      }`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium px-3">
                  <div className="flex items-center gap-2">
                    <InventoryIsOnSaleBadge
                      isOnSale={row.is_on_sale}
                      onlyIcon
                    />
                    <span>{row.products?.model || row.name}</span>
                  </div>
                </TableCell>
                <TableCell className="px-3">{row.storage || '-'}</TableCell>
                <TableCell className="px-3">{row.color || '-'}</TableCell>
                <TableCell className="px-3">
                  {row.battery_health
                    ? `${row.battery_health}%`
                    : row.condition === 'new'
                      ? '100%'
                      : '-'}
                </TableCell>
                <TableCell className="px-3 max-w-[250px]">
                  {row.notes ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate">{row.notes}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-sm whitespace-pre-wrap">
                          {row.notes}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="px-3">{row.imei || '-'}</TableCell>
                <TableCell className="px-3 text-right">
                  {(() => {
                    const cost = 'cost' in row ? ((row.cost as number) ?? 0) : 0
                    const fixCost = row.total_fix_cost ?? 0
                    const total = cost + fixCost
                    return total > 0 ? formatCurrency(total) : '-'
                  })()}
                </TableCell>
                <TableCell className="px-3 text-right">
                  {'cost' in row && row.cost != null
                    ? formatCurrency(row.cost as number)
                    : '-'}
                </TableCell>
                <TableCell className="px-3 text-right">
                  {row.total_fix_cost !== undefined &&
                  row.total_fix_cost !== null
                    ? formatCurrency(row.total_fix_cost)
                    : '-'}
                </TableCell>
                <TableCell className="px-3">
                  {row.trade_in_customer_name || '-'}
                </TableCell>
                <TableCell className="font-semibold px-3 text-right">
                  {'price' in row && row.price != null
                    ? formatCurrency(row.price as number)
                    : '-'}
                </TableCell>
                <TableCell className="font-semibold px-3 text-right">
                  {'wholesale_price' in row && row.wholesale_price !== null
                    ? formatCurrency(row.wholesale_price as number)
                    : '-'}
                </TableCell>
                <TableCell className="px-3 text-right">
                  {'quantity' in row ? (row.quantity ?? 0) : '-'}
                </TableCell>
                <TableCell className="px-3 max-w-[200px]">
                  {row.batch_name ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate">{row.batch_name}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{row.batch_name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="px-3">
                  <InventoryConditionBadge condition={row.condition || 'new'} />
                </TableCell>
                <TableCell className="space-y-2 px-3">
                  {row.status ? (
                    row.table === 'accessory_items' && row.quantity === 0 ? (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 w-fit rounded-full"
                      >
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Sin Stock
                      </Badge>
                    ) : (
                      <InventoryStatusBadge status={row.status as ItemStatus} />
                    )
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="capitalize px-3">
                  <InventoryTypeBadge type={row.products?.type ?? 'product'} />
                </TableCell>
                <TableCell className="px-3">
                  {row.created_at
                    ? format(new Date(row.created_at), 'dd/MM/yyyy')
                    : '-'}
                </TableCell>
                <TableCell className="px-3">
                  {row.created_by_full_name || '-'}
                </TableCell>
                {!hideActions && (
                  <TableCell className="px-3 text-right">
                    <InventoryActionButtons row={row} />
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
