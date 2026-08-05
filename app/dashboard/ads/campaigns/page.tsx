'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kampagnen</h1>
          <p className="text-muted-foreground mt-1">Alle Werbekampagnen verwalten</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" />Neue Kampagne</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Plattform</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Budget</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Ausgaben</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">ROAS</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">KI-Score</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50 hover:bg-muted/50">
                  <td className="p-4 font-medium" colSpan={7}>
                    <p className="text-muted-foreground text-center py-8">
                      Noch keine Kampagnen. Verbinde Google Ads oder Meta Ads in den Einstellungen.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
