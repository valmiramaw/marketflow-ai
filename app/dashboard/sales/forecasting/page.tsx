'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '../../components/kpi-card'
import { TrendingUp, DollarSign, Target, Calendar } from 'lucide-react'

export default function ForecastingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Forecasting</h1>
        <p className="text-muted-foreground mt-1">KI-basierte Umsatzprognosen</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Forecast Q3" value="--" icon={<DollarSign className="w-5 h-5" />} />
        <KpiCard title="Erwartete Deals" value="--" icon={<Target className="w-5 h-5" />} />
        <KpiCard title="Konfidenz" value="--" icon={<TrendingUp className="w-5 h-5" />} />
        <KpiCard title="Avg. Close-Time" value="--" icon={<Calendar className="w-5 h-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Umsatzprognose</CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <p className="text-muted-foreground text-center">
            Mindestens 10 abgeschlossene Deals nötig für eine KI-Prognose.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
