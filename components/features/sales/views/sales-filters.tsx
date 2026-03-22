'use client'

import { Input } from '@/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { Search } from 'lucide-react'
import { DateRangePicker } from '@/components/shared/forms/date-range'
import { DateRange } from 'react-day-picker'

interface SalesFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterPaymentMethod: 'all' | 'cash' | 'transfer' | 'crypto'
  onFilterPaymentMethodChange: (
    value: 'all' | 'cash' | 'transfer' | 'crypto'
  ) => void
  orderBy: 'sale_date' | 'created_at' | 'delivery_date'
  onOrderByChange: (value: 'sale_date' | 'created_at' | 'delivery_date') => void
  sortDirection: 'asc' | 'desc'
  onSortDirectionChange: (value: 'asc' | 'desc') => void
  range?: DateRange
  onRangeChange?: (range: DateRange | undefined) => void
}

export default function SalesFilters({
  searchTerm,
  onSearchChange,
  filterPaymentMethod,
  onFilterPaymentMethodChange,
  orderBy,
  onOrderByChange,
  sortDirection,
  onSortDirectionChange,
  range,
  onRangeChange,
}: SalesFiltersProps) {
  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por cliente, producto o IMEI..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filterPaymentMethod}
          onValueChange={onFilterPaymentMethodChange}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por método de pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Métodos</SelectItem>
            <SelectItem value="cash">Efectivo</SelectItem>
            <SelectItem value="transfer">Transferencia</SelectItem>
            <SelectItem value="crypto">Cripto</SelectItem>
          </SelectContent>
        </Select>
        <Select value={orderBy} onValueChange={onOrderByChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sale_date">Fecha de Venta</SelectItem>
            <SelectItem value="created_at">Fecha de Carga</SelectItem>
            <SelectItem value="delivery_date">Fecha de Entrega</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortDirection} onValueChange={onSortDirectionChange}>
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Dirección" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">ASC</SelectItem>
            <SelectItem value="desc">DESC</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Picker Row */}
      {range !== undefined && onRangeChange && (
        <div className="flex gap-2">
          <DateRangePicker range={range} onRangeChange={onRangeChange} />
        </div>
      )}
    </div>
  )
}
