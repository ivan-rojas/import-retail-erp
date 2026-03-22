import { TableHead } from '@/ui/table'
import { ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react'

export default function SortableTableHead({
  column,
  label,
  sortColumns,
  onColumnSort,
  onRemoveSortColumn,
  className = 'px-3',
}: {
  column: string
  label: string
  sortColumns?: Array<{ column: string; direction: 'asc' | 'desc' }>
  onColumnSort?: (column: string) => void
  onRemoveSortColumn?: (column: string) => void
  className?: string
}) {
  const sortInfo = sortColumns?.find((item) => item.column === column)
  const sortOrder =
    (sortColumns?.findIndex((item) => item.column === column) ?? -1) + 1
  const isSortable = !!onColumnSort

  const handleClick = () => {
    if (isSortable) {
      onColumnSort(column)
    }
  }

  const handleRemoveSort = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemoveSortColumn) {
      onRemoveSortColumn(column)
    }
  }

  const getSortIcon = () => {
    if (!isSortable) return null
    if (!sortInfo) return <ArrowUpDown className="w-4 h-4" />
    return sortInfo.direction === 'asc' ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    )
  }

  return (
    <TableHead
      className={`${className} ${
        isSortable ? 'cursor-pointer hover:bg-muted select-none' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-1">
        {label}
        {getSortIcon()}
        {sortInfo && (
          <div className="flex items-center gap-1">
            <span className="text-xs bg-muted-foreground text-white px-1 rounded">
              {sortOrder}
            </span>
            {onRemoveSortColumn && (
              <button
                onClick={handleRemoveSort}
                className="text-muted-foreground hover:text-muted-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </TableHead>
  )
}
