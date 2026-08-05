'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '../../components/kpi-card'
import { DollarSign, TrendingUp, PieChart, AlertTriangle } from 'lucide-react'

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Budget-Übersicht</h1>
        <p className="text-muted-foreground mt-1">KI-optimierte Budget-Verteilung</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Monatsbudget" value="€15.000" icon={<DollarSign className="w-5 h-5" />} />
        <KpiCard title="Verbraucht" value="€12.450" change={-3.2} icon={<PieChart className="w-5 h-5" />} />
        <KpiCard title="Verbleibend" value="€2.550" icon={<TrendingUp className="w-5 h-5" />} />
        <KpiCard title="KI-Einsparpotenzial" value="€1.200" icon={<AlertTriangle className="w-5 h-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget-Verteilung</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-12">
            Verbinde Google Ads oder Meta Ads um Budget-Analysen zu sehen.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
