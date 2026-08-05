'use client'

import { KpiCard } from '../components/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Eye, MousePointerClick, Target } from 'lucide-react'

export default function AdsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance Marketing</h1>
        <p className="text-muted-foreground mt-1">
          Google Ads & Meta Ads auf einen Blick
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Gesamtausgaben" value="€12.450" change={-3.2} icon={<DollarSign className="w-5 h-5" />} />
        <KpiCard title="Impressionen" value="284.500" change={12.5} icon={<Eye className="w-5 h-5" />} />
        <KpiCard title="Klicks" value="8.230" change={5.8} icon={<MousePointerClick className="w-5 h-5" />} />
        <KpiCard title="Conversions" value="312" change={18.2} icon={<Target className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Kampagnen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Brand Awareness Q3', platform: 'Google', roas: 4.1, spend: '€3.200', status: 'active' },
                { name: 'Retargeting Bestandskunden', platform: 'Meta', roas: 5.8, spend: '€1.800', status: 'active' },
                { name: 'Lead Gen B2B', platform: 'Google', roas: 2.3, spend: '€4.500', status: 'active' },
                { name: 'Produkt Launch', platform: 'Meta', roas: 1.9, spend: '€2.950', status: 'paused' },
              ].map((campaign) => (
                <div key={campaign.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">{campaign.platform} · {campaign.spend}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{campaign.roas}x ROAS</span>
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status === 'active' ? 'Aktiv' : 'Pausiert'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>KI-Empfehlungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-orange-500/20 bg-orange-500/5">
                <p className="text-sm font-medium">Budget erhöhen: Brand Awareness Q3</p>
                <p className="text-xs text-muted-foreground mt-1">ROAS 4.1x — 20% mehr Budget könnte €2.400 zusätzlichen Umsatz generieren</p>
              </div>
              <div className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                <p className="text-sm font-medium">A/B Test vorgeschlagen: Lead Gen B2B</p>
                <p className="text-xs text-muted-foreground mt-1">Neue Headline-Variante basierend auf Top-Keywords testen</p>
              </div>
              <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                <p className="text-sm font-medium">Produkt Launch pausieren?</p>
                <p className="text-xs text-muted-foreground mt-1">ROAS unter Zielwert (1.9x vs. 2.5x Minimum). Zielgruppe überprüfen.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
