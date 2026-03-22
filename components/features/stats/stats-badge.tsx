import { cn } from '@/lib/utils'
import { Badge } from '@/ui/badge'

export default function StatsBadge({
  value,
  isPositive,
}: {
  value: string
  isPositive: boolean
}) {
  const trendColor = isPositive ? 'text-green-600' : 'text-red-600'
  return (
    <Badge variant="outline" className={cn(trendColor, 'rounded-full')}>
      {value}
    </Badge>
  )
}
