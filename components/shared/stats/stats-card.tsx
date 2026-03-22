import { Badge } from '@/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/ui/card'
import { TrendingUp, TrendingDown, MoveRight } from 'lucide-react'
import { calculatePercentageChange, formatPercentageChange } from '@/lib/utils'

type TrendIcon = 'up' | 'down' | 'neutral'

interface StatsCardProps {
  title: string
  value: number
  previousValue?: number
  percentage?: number
  description?: string
  footer?: string
  showComparison?: boolean
  isCurrency?: boolean
  descriptionTrendIcon?: TrendIcon
}

export default function StatsCard({
  title,
  value,
  previousValue,
  percentage,
  description,
  footer,
  showComparison = true,
  isCurrency = true,
  descriptionTrendIcon,
}: StatsCardProps) {
  // Calculate percentage change if previousValue is provided
  const calculatedPercentage =
    previousValue !== undefined
      ? calculatePercentageChange(value, previousValue)
      : percentage || 0

  const isPositive = calculatedPercentage >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown
  const trendColor = isPositive ? 'text-green-600' : 'text-red-600'

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {isCurrency ? (
            <span className="inline-flex items-baseline gap-1">
              ${value.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground">USD</span>
            </span>
          ) : (
            value.toLocaleString()
          )}
        </CardTitle>
        {showComparison && (
          <CardAction>
            <Badge variant="outline" className={trendColor}>
              <TrendIcon className="size-3" />
              {formatPercentageChange(calculatedPercentage)}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        {description && (
          <div className="line-clamp-1 flex gap-2 font-medium">
            {description}{' '}
            {descriptionTrendIcon && (
              <>
                {descriptionTrendIcon === 'up' && (
                  <TrendingUp className="size-4" color="green" />
                )}
                {descriptionTrendIcon === 'down' && (
                  <TrendingDown className="size-4" color="red" />
                )}
                {descriptionTrendIcon === 'neutral' && (
                  <MoveRight className="size-4" color="gray" />
                )}
              </>
            )}
          </div>
        )}
        {footer && <div className="text-muted-foreground">{footer}</div>}
        {previousValue !== undefined && showComparison && (
          <div className="text-muted-foreground text-xs">
            Anterior:{' '}
            {isCurrency ? (
              <span className="inline-flex items-baseline gap-0.5">
                ${previousValue.toLocaleString()}
                <span className="text-[10px]">USD</span>
              </span>
            ) : (
              previousValue.toLocaleString()
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
