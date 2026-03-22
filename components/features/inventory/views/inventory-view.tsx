'use client'

import type { InventoryRow } from '@/lib/types/inventory'
import InventoryList from './inventory-list'
import InventoryTable from './inventory-table'
import InventoryGroupBySummary from './inventory-group-by-summary'

type SortColumn = { column: string; direction: 'asc' | 'desc' }

interface InventoryViewProps {
  data: InventoryRow[]
  groupedData: Array<{ key: string; rows: InventoryRow[] }>
  groupBy: string[]
  view: 'list' | 'table'
  sortColumns: SortColumn[]
  sortColumnsByGroup?: Record<string, SortColumn[]>
  onColumnSort: (column: string, groupKey?: string) => void
  onRemoveSortColumn: (column: string, groupKey?: string) => void
  forceUpdate: () => void
}

function InventoryView({
  data,
  groupedData,
  groupBy,
  view,
  sortColumns,
  sortColumnsByGroup = {},
  onColumnSort,
  onRemoveSortColumn,
  forceUpdate,
}: InventoryViewProps) {
  if (groupBy.length === 0) {
    return view === 'list' ? (
      <InventoryList data={data} />
    ) : (
      <InventoryTable
        data={data}
        sortColumns={sortColumns}
        onColumnSort={onColumnSort}
        onRemoveSortColumn={onRemoveSortColumn}
        forceUpdate={forceUpdate}
      />
    )
  }

  return (
    <div className="space-y-6">
      {groupedData.map((group) => (
        <div key={group.key} className="space-y-3">
          <div className="flex items-center justify-between">
            <InventoryGroupBySummary rows={group.rows} groupKey={group.key} />
          </div>
          {view === 'list' ? (
            <InventoryList data={group.rows} />
          ) : (
            <InventoryTable
              data={group.rows}
              sortColumns={sortColumnsByGroup[group.key] ?? []}
              onColumnSort={(col) => onColumnSort(col, group.key)}
              onRemoveSortColumn={(col) => onRemoveSortColumn(col, group.key)}
              forceUpdate={forceUpdate}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default InventoryView
