'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KpiCard } from '../../components/kpi-card'
import { TrendingUp, DollarSign, Target, Calendar, Loader2, Sparkles, AlertTriangle } from 'lucide-react'

interface ForecastData {
  summary: {
    totalLeads: number
    activeDeals: number
    wonDeals: number
    avgDealValue: number
    winRate: number
    pipelineValue: number
    weightedPipeline: number
  }
  pipelineByStatus: Record<string, number>
  monthlyTrend: Array<{ month: string; count: number; value: number }>
  hasEnoughData: boolean
}

interface Forecast {
  quarterForecast: number
  expectedDeals: number
  confidence: number
  avgCloseTime: string
  topOpportunities: Array<{ company: string; probability: number; value: number }>
  risks: string[]
  recommendations: string[]
}

const statusLabels: Record<string, string> = {
  new: 'Neu',
  contacted: 'Kontaktiert',
  qualified: 'Qualifiziert',
  proposal: 'Angebot',
  negotiation: 'Verhandlung',
}

export default function ForecastingPage() {
  const [data, setData] = useState<ForecastData | null>(null)
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetch('/api/sales/forecasting')
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  async function generateForecast() {
    setGenerating(true)
    const res = await fetch('/api/sales/forecasting', { method: 'POST' })
    if (res.ok) setForecast(await res.json())
    setGenerating(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  const summary = data?.summary || { totalLeads: 0, activeDeals: 0, wonDeals: 0, avgDealValue: 0, winRate: 0, pipelineValue: 0, weightedPipeline: 0 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Forecasting</h1>
          <p className="text-muted-foreground mt-1">KI-basierte Umsatzprognosen</p>
        </div>
        <Button onClick={generateForecast} disabled={generating || !data?.hasEnoughData}>
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          KI-Prognose erstellen
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Pipeline-Wert"
          value={`${summary.pipelineValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}€`}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <KpiCard
          title="Gewichtete Pipeline"
          value={`${summary.weightedPipeline.toLocaleString('de-DE', { minimumFractionDigits: 2 })}€`}
          icon={<Target className="w-5 h-5" />}
        />
        <KpiCard
          title="Win-Rate"
          value={`${summary.winRate.toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KpiCard
          title="Avg. Deal-Wert"
          value={`${summary.avgDealValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}€`}
          icon={<Calendar className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline nach Status */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline nach Status</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.activeDeals === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">Keine aktiven Deals.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data?.pipelineByStatus || {}).map(([status, count]) => {
                  const maxCount = Math.max(...Object.values(data?.pipelineByStatus || {}))
                  const width = maxCount > 0 ? (count / maxCount) * 100 : 0
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{statusLabels[status] || status}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="h-2 rounded-full bg-purple-500/70" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monatlicher Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monatliche Abschlüsse</CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.monthlyTrend?.length ? (
              <p className="text-muted-foreground text-center py-8 text-sm">Noch nicht genug Daten.</p>
            ) : (
              <div className="space-y-2">
                {data.monthlyTrend.map((m) => (
                  <div key={m.month} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-sm">{m.month}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{m.value.toLocaleString('de-DE')}€</span>
                      <Badge variant="secondary">{m.count} Deals</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KI-Prognose */}
      {forecast && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />KI-Prognose
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">{forecast.quarterForecast?.toLocaleString('de-DE')}€</p>
                <p className="text-sm text-muted-foreground">Quartals-Forecast</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">{forecast.expectedDeals}</p>
                <p className="text-sm text-muted-foreground">Erwartete Deals</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className={`text-2xl font-bold ${forecast.confidence >= 70 ? 'text-green-500' : forecast.confidence >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {forecast.confidence}%
                </p>
                <p className="text-sm text-muted-foreground">Konfidenz</p>
              </div>
            </div>

            {forecast.topOpportunities?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Top Opportunities</p>
                <div className="space-y-2">
                  {forecast.topOpportunities.map((o, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm">{o.company}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{o.value?.toLocaleString('de-DE')}€</span>
                        <Badge className={o.probability >= 70 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}>
                          {o.probability}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {forecast.risks?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Risiken</p>
                <ul className="space-y-1">
                  {forecast.risks.map((r, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 mt-1 shrink-0 text-yellow-500" />{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {forecast.recommendations?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Empfehlungen</p>
                <ul className="space-y-1">
                  {forecast.recommendations.map((r, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!data?.hasEnoughData && (
        <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 text-center">
          <p className="text-sm">Mindestens 5 abgeschlossene Deals nötig für eine KI-Prognose. Aktuell: {summary.wonDeals} Deals.</p>
        </div>
      )}
    </div>
  )
}
