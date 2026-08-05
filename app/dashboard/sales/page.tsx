'use client'

import { KpiCard } from '../components/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, DollarSign, TrendingUp, Target } from 'lucide-react'

const pipelineStages = [
  { name: 'Neu', count: 8, value: '€24.000', color: 'bg-blue-500' },
  { name: 'Kontaktiert', count: 6, value: '€38.000', color: 'bg-yellow-500' },
  { name: 'Qualifiziert', count: 5, value: '€42.500', color: 'bg-orange-500' },
  { name: 'Proposal', count: 3, value: '€28.000', color: 'bg-purple-500' },
  { name: 'Gewonnen', count: 1, value: '€16.000', color: 'bg-green-500' },
]

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Intelligence</h1>
        <p className="text-muted-foreground mt-1">
          KI-gestütztes Lead-Management & Pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Pipeline-Wert" value="€148.500" change={12.0} icon={<DollarSign className="w-5 h-5" />} />
        <KpiCard title="Offene Leads" value="23" change={15.3} icon={<Users className="w-5 h-5" />} />
        <KpiCard title="Win Rate" value="34%" change={2.1} icon={<TrendingUp className="w-5 h-5" />} />
        <KpiCard title="Avg. Deal-Größe" value="€6.450" change={-1.5} icon={<Target className="w-5 h-5" />} />
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 h-8 rounded-lg overflow-hidden">
            {pipelineStages.map((stage) => (
              <div
                key={stage.name}
                className={`${stage.color} flex-1 flex items-center justify-center`}
                title={`${stage.name}: ${stage.count} Leads (${stage.value})`}
              >
                <span className="text-xs font-medium text-white">{stage.count}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            {pipelineStages.map((stage) => (
              <div key={stage.name} className="flex-1 text-center">
                <p className="text-xs font-medium">{stage.name}</p>
                <p className="text-xs text-muted-foreground">{stage.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Leads (KI-Score)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { company: 'TechCorp GmbH', score: 92, value: '€18.000', status: 'qualified' },
                { company: 'Digital Solutions AG', score: 85, value: '€12.500', status: 'proposal' },
                { company: 'StartupHub Berlin', score: 78, value: '€8.000', status: 'contacted' },
              ].map((lead) => (
                <div key={lead.company} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{lead.company}</p>
                    <p className="text-xs text-muted-foreground">{lead.value}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500/10 text-purple-500">{lead.score}/100</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fällige Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Keine fälligen Follow-ups.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
