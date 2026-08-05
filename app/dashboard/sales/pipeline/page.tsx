'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const stages = [
  { id: 'new', label: 'Neu', color: 'border-blue-500' },
  { id: 'contacted', label: 'Kontaktiert', color: 'border-yellow-500' },
  { id: 'qualified', label: 'Qualifiziert', color: 'border-orange-500' },
  { id: 'proposal', label: 'Proposal', color: 'border-purple-500' },
  { id: 'won', label: 'Gewonnen', color: 'border-green-500' },
]

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pipeline</h1>
        <p className="text-muted-foreground mt-1">Kanban-Ansicht der Sales-Pipeline</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-72">
            <Card className={`border-t-2 ${stage.color}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
                  <Badge variant="secondary">0</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="min-h-[200px] flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Keine Leads</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
