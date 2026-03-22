'use client'

import { ChevronDownIcon } from 'lucide-react'
import { type DateRange } from 'react-day-picker'

import { Button } from '@/ui/button'
import { Calendar } from '@/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'

export function DateRangePicker({
  range,
  onRangeChange,
}: {
  range: DateRange | undefined
  onRangeChange: (range: DateRange | undefined) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="dates"
            className="w-full sm:w-56 justify-between font-normal"
          >
            {range?.from && range?.to
              ? `${range.from.toLocaleDateString(
                  'es-ES'
                )} - ${range.to.toLocaleDateString('es-ES')}`
              : 'Seleccionar fecha de rango'}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="range"
            selected={range}
            captionLayout="dropdown"
            onSelect={(range) => {
              onRangeChange(range)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
