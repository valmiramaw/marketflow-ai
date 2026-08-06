'use client'

import { useState, useEffect } from 'react'
import { KpiCard } from '../../components/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, DollarSign, TrendingUp, PieChart, Sparkles, AlertTriangle } from 'lucide-react'
import { InfoBox } from '../../components/info-box'

interface BudgetCampaign {
  id: string
  name: string
  platform: string
  status: string
  dailyBudget: number
  monthlyBudget: number
  spend30d: number
  revenue30d: number
  roas: number
  utilization: number
}

interface BudgetData {
  summary: {
    totalBudget: number
    totalSpend: number
    totalRevenue: number
    remaining: number
    overallRoas: number
    utilization: number
  }
  campaigns: BudgetCampaign[]
}

interface Optimization {
  totalSavings: number
  expectedRoasImprovement: number
  suggestions: Array<{
    campaignName: string
    currentBudget: number
    suggestedBudget: number
    action: string
    reason: string
    expectedImpact: string
  }>
  generalRecommendations: string[]
  summary: string
}

export default function BudgetsPage() {
  const [data, setData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [optimization, setOptimization] = useState<Optimization | null>(null)

  useEffect(() => {
    fetch('/api/ads/budgets')
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  async function runOptimization() {
    setOptimizing(true)
    const res = await fetch('/api/ads/budgets/optimize', { method: 'POST' })
    if (res.ok) setOptimization(await res.json())
    setOptimizing(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  const summary = data?.summary || {
    totalBudget: 0,
    totalSpend: 0,
    totalRevenue: 0,
    remaining: 0,
    overallRoas: 0,
    utilization: 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budget-Übersicht</h1>
          <p className="text-muted-foreground mt-1">KI-optimierte Budget-Verteilung</p>
        </div>
        <Button onClick={runOptimization} disabled={optimizing}>
          {optimizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          KI-Optimierung
        </Button>
      </div>

      <InfoBox title="KI-Budget-Optimierung" variant="ai" storageKey="budgets-tip">
        <p>Klicke <strong>KI-Optimierung</strong> oben rechts. Die KI analysiert alle Kampagnen und schlaegt vor, wie du dein Budget umverteilen kannst fuer maximalen ROAS. Du siehst Einsparpotenzial und konkrete Vorschlaege pro Kampagne.</p>
      </InfoBox>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Monatsbudget"
          value={`${summary.totalBudget.toLocaleString('de-DE', { minimumFractionDigits: 2 })}€`}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <KpiCard
          title="Verbraucht (30 Tage)"
          value={`${summary.totalSpend.toLocaleString('de-DE', { minimumFractionDigits: 2 })}€`}
          icon={<PieChart className="w-5 h-5" />}
        />
        <KpiCard
          title="Verbleibend"
          value={`${summary.remaining.toLocaleString('de-DE', { minimumFractionDigits: 2 })}€`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KpiCard
          title="ROAS (gesamt)"
          value={`${summary.overallRoas.toFixed(2)}x`}
          icon={<DollarSign className="w-5 h-5" />}
        />
      </div>

      {/* Budget-Verteilung pro Kampagne */}
      <Card>
        <CardHeader>
          <CardTitle>Budget-Verteilung pro Kampagne</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.campaigns?.length ? (
            <p className="text-muted-foreground text-center py-8">Keine aktiven Kampagnen mit Budget.</p>
          ) : (
            <div className="space-y-3">
              {data.campaigns.map((c) => (
                <div key={c.id} className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{{ google: 'Google', meta: 'Meta', tiktok: 'TikTok', snapchat: 'Snapchat' }[c.platform] || c.platform}</Badge>
                      <span className="text-sm font-medium">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">{c.spend30d.toFixed(2)}€ / {c.monthlyBudget.toFixed(2)}€</span>
                      <Badge className={c.roas >= 2 ? 'bg-green-500/10 text-green-500' : c.roas >= 1 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}>
                        {c.roas.toFixed(2)}x ROAS
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        c.utilization > 100 ? 'bg-red-500' : c.utilization > 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(c.utilization, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{c.utilization.toFixed(1)}% verbraucht</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* KI-Optimierungsvorschläge */}
      {optimization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />KI-Budget-Optimierung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{optimization.summary}</p>

            {optimization.totalSavings > 0 && (
              <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                <p className="text-sm font-medium text-green-500">
                  Einsparpotenzial: {optimization.totalSavings.toFixed(2)}€
                </p>
              </div>
            )}

            {optimization.suggestions?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Vorschläge</p>
                {optimization.suggestions.map((s, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{s.campaignName}</span>
                      <Badge variant="outline" className="text-xs">
                        {s.action === 'increase' ? 'Erhöhen' : s.action === 'decrease' ? 'Reduzieren' : s.action === 'pause' ? 'Pausieren' : 'Beibehalten'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {s.currentBudget.toFixed(2)}€ → {s.suggestedBudget.toFixed(2)}€
                    </p>
                    <p className="text-xs text-muted-foreground">{s.reason}</p>
                  </div>
                ))}
              </div>
            )}

            {optimization.generalRecommendations?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Allgemeine Empfehlungen</p>
                <ul className="space-y-1">
                  {optimization.generalRecommendations.map((r, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 mt-1 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
