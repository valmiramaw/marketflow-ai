'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
}

export function KpiCard({ title, value, change, changeLabel, icon, className }: KpiCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {change > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : change < 0 ? (
              <TrendingDown className="w-4 h-4 text-red-500" />
            ) : (
              <Minus className="w-4 h-4 text-muted-foreground" />
            )}
            <span
              className={cn(
                'text-xs font-medium',
                change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-muted-foreground'
              )}
            >
              {change > 0 ? '+' : ''}
              {change}% {changeLabel || 'vs. Vorwoche'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
