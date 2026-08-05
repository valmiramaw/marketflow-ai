'use client'

import { Card, CardContent } from '@/components/ui/card'
import { KpiCard } from '../../components/kpi-card'
import { Users, Eye, Clock, ArrowDownUp } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">GA4 Traffic-Daten</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Sessions" value="--" icon={<Users className="w-5 h-5" />} />
        <KpiCard title="Pageviews" value="--" icon={<Eye className="w-5 h-5" />} />
        <KpiCard title="Avg. Dauer" value="--" icon={<Clock className="w-5 h-5" />} />
        <KpiCard title="Bounce Rate" value="--" icon={<ArrowDownUp className="w-5 h-5" />} />
      </div>

      <Card>
        <CardContent className="py-12">
          <p className="text-muted-foreground text-center">
            Verbinde Google Analytics (GA4) in den Einstellungen.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
