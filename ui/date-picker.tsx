'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Calendar } from '@/ui/calendar'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: Date
  maxDate?: Date
  showTime?: boolean
  timeLabel?: string
  timeValue?: string
  onTimeChange?: (time: string) => void
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = 'Seleccionar fecha',
  disabled = false,
  className,
  minDate,
  maxDate,
  showTime = false,
  timeLabel = 'Hora',
  timeValue = '',
  onTimeChange,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          {date ? (
            showTime && timeValue ? (
              `${format(date, 'dd/MM/yyyy')} ${timeValue}`
            ) : (
              format(date, 'dd/MM/yyyy')
            )
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            disabled={(date) => {
              if (minDate && date < minDate) return true
              if (maxDate && date > maxDate) return true
              return false
            }}
            captionLayout="dropdown"
          />
          {showTime && (
            <div className="border-t p-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="time-picker" className="px-1">
                  {timeLabel}
                </Label>
                <Input
                  type="time"
                  id="time-picker"
                  value={timeValue}
                  onChange={(e) => onTimeChange?.(e.target.value)}
                  className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
