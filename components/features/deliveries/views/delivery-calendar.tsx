'use client'

import { useState, useEffect } from 'react'

import { Calendar, CalendarDayButton } from '@/ui/calendar'
import { useDeliveries } from '@/lib/hooks/use-deliveries'
import { DeliveryDTO } from '@/lib/types/delivery'
import DeliveryCard from './delivery-card'
import { ScrollArea, ScrollBar } from '@/ui/scroll-area'
import { es } from 'date-fns/locale'
import { format } from 'date-fns'
import DeliveryForm from '../forms/delivery-form'
import { Button } from '@/ui/button'

export default function DeliveryCalendar() {
  const { data: deliveries } = useDeliveries()

  const [date, setDate] = useState<Date | undefined>(new Date())
  const [deliveriesByDate, setDeliveriesByDate] = useState<DeliveryDTO[]>([])
  const [deliveriesCountByDate, setDeliveriesCountByDate] = useState<
    Record<string, number>
  >({})

  // Calculate deliveries count by date only when deliveries change
  useEffect(() => {
    if (deliveries) {
      const countByDate: Record<string, number> = {}
      deliveries.forEach((delivery) => {
        const deliveryDate = format(delivery.delivery_date, 'yyyy-MM-dd')
        countByDate[deliveryDate] = (countByDate[deliveryDate] || 0) + 1
      })
      setDeliveriesCountByDate(countByDate)
    }
  }, [deliveries])

  // Filter deliveries for selected date only when date or deliveries change
  useEffect(() => {
    if (deliveries && date) {
      const filteredDeliveries = deliveries.filter((delivery) =>
        delivery?.delivery_date.startsWith(format(date, 'yyyy-MM-dd'))
      )
      setDeliveriesByDate(filteredDeliveries)
    }
  }, [deliveries, date])

  return (
    <div className="w-full lg:max-h-[calc(100dvh-16rem)] pt-2 px-4 sm:px-6 pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Section - Left */}
          <div className="flex flex-col items-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={es}
              className="rounded-md border p-6 w-full max-w-xl lg:max-w-4xl"
              required
              components={{
                DayButton: ({ children, modifiers, day, ...props }) => {
                  const dateString = format(day.date, 'yyyy-MM-dd')
                  const deliveryCount = deliveriesCountByDate[dateString] || 0

                  return (
                    <CalendarDayButton
                      day={day}
                      modifiers={modifiers}
                      {...props}
                    >
                      {children}
                      {!modifiers.outside && deliveryCount > 0 && (
                        <span className="text-xs text-blue-500 font-medium">
                          {deliveryCount}
                        </span>
                      )}
                    </CalendarDayButton>
                  )
                },
              }}
            />
          </div>

          {/* Events Section - Right */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-lg font-semibold">
                {date?.toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <DeliveryForm trigger={<Button>Crear Entrega</Button>} />
            </div>

            <ScrollArea className="max-h-[clamp(18rem,50dvh,36rem)] rounded-md border">
              <div className="flex flex-col gap-3">
                {deliveriesByDate.length > 0 ? (
                  deliveriesByDate.map((delivery) => (
                    <DeliveryCard key={delivery.id} delivery={delivery} />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No hay entregas programadas para esta fecha</p>
                  </div>
                )}
              </div>
              <ScrollBar />
            </ScrollArea>
          </div>
        </div>
    </div>
  )
}
