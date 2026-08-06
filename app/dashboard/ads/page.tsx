'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { KpiCard } from '../components/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Megaphone, TrendingUp, MousePointerClick, Target, DollarSign } from 'lucide-react'
import { InfoBox } from '../components/info-box'

interface Campaign {
  id: string
  name: string
  platform: string
  status: string
  totalSpend: number
  totalRevenue: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  roas: number
  ctr: number
  aiScore: number | null
}

export default function AdsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ads/campaigns')
      .then((r) => (r.ok ? r.json() : []))
      .then(setCampaigns)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const totalSpend = campaigns.reduce((s, c) => s + c.totalSpend, 0)
  const totalRevenue = campaigns.reduce((s, c) => s + c.totalRevenue, 0)
  const totalImpressions = campaigns.reduce((s, c) => s + c.totalImpressions, 0)
  const totalClicks = campaigns.reduce((s, c) => s + c.totalClicks, 0)
  const totalConversions = campaigns.reduce((s, c) => s + c.totalConversions, 0)
  const overallRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const activeCampaigns = campaigns.filter((c) => c.status === 'active')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance Marketing</h1>
        <p className="text-muted-foreground mt-1">Alle Ads-Kampagnen im Überblick</p>
      </div>

      <InfoBox title="Performance Marketing - So funktioniert's" variant="ai" storageKey="ads-intro">
        <p>Verwalte deine Google, Meta, TikTok & Snapchat Ads Kampagnen mit KI-Unterstützung.</p>
        <ul>
          <li><strong>Kampagnen</strong> - Erstelle und verwalte Kampagnen, die KI analysiert Performance und gibt dir einen Score (0-100)</li>
          <li><strong>Budgets</strong> - Sehe Budget-Auslastung pro Kampagne, lass die KI Optimierungsvorschläge machen</li>
          <li><strong>A/B Tests</strong> - Vergleiche zwei Varianten, die KI wertet aus welche besser performt</li>
          <li><strong>Werbemittel</strong> - Lade Creatives hoch, Gemini Vision analysiert Bilder automatisch</li>
        </ul>
        <p className="mt-2">Unterstützte Plattformen: Google Ads, Meta Ads, TikTok Ads & Snapchat Ads. Verbinde Google unter Einstellungen für automatischen Daten-Sync.</p>
      </InfoBox>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Gesamtausgaben"
          value={`${totalSpend.toLocaleString('de-DE', { minimumFractionDigits: 2 })}€`}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <KpiCard
          title="ROAS"
          value={`${overallRoas.toFixed(2)}x`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KpiCard
          title="Klicks"
          value={totalClicks.toLocaleString('de-DE')}
          icon={<MousePointerClick className="w-5 h-5" />}
        />
        <KpiCard
          title="Conversions"
          value={String(totalConversions)}
          icon={<Target className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Kampagnen</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/ads/campaigns')}>
              Alle anzeigen
            </Button>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-center py-8">
                <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">Noch keine Kampagnen.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push('/dashboard/ads/campaigns')}
                >
                  Erste Kampagne erstellen
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {campaigns
                  .sort((a, b) => b.totalSpend - a.totalSpend)
                  .slice(0, 5)
                  .map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/80 transition"
                      onClick={() => router.push('/dashboard/ads/campaigns')}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {{ google: 'Google', meta: 'Meta', tiktok: 'TikTok', snapchat: 'Snapchat' }[c.platform] || c.platform}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.totalClicks} Klicks | {c.totalConversions} Conv.
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{c.roas.toFixed(2)}x ROAS</p>
                        <p className="text-xs text-muted-foreground">
                          {c.totalSpend.toFixed(2)}€
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status-Übersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Aktive Kampagnen</span>
                <Badge className="bg-green-500/10 text-green-500">{activeCampaigns.length}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Pausierte Kampagnen</span>
                <Badge variant="secondary">{campaigns.filter((c) => c.status === 'paused').length}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Entwürfe</span>
                <Badge variant="outline">{campaigns.filter((c) => c.status === 'draft').length}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Impressionen gesamt</span>
                <span className="text-sm font-medium">{totalImpressions.toLocaleString('de-DE')}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">CTR (Durchschnitt)</span>
                <span className="text-sm font-medium">
                  {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0'}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
