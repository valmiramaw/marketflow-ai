'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { KpiCard } from './components/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Megaphone, Search, Users, TrendingUp, DollarSign,
  MousePointerClick, UserPlus, Loader2, Sparkles, Target,
  Cpu, AlertCircle, CheckCircle, XCircle,
} from 'lucide-react'
import { InfoBox } from './components/info-box'

interface DashboardData {
  ads: {
    activeCampaigns: number
    totalCampaigns: number
    totalSpend: number
    totalRevenue: number
    roas: number
    impressions: number
    clicks: number
    conversions: number
    ctr: number
  }
  seo: {
    totalKeywords: number
    top10Keywords: number
    top3Keywords: number
    avgRank: number
    contentInProgress: number
    contentIdeas: number
  }
  sales: {
    totalLeads: number
    hotLeads: number
    pipelineValue: number
    wonDeals: number
    wonValue: number
    totalProposals: number
    dueFollowUps: number
  }
  ai: {
    totalTokens: number
    totalCost: number
    calls: number
    providers: { claude: number; openai: number; gemini: number }
  }
  syncs: Array<{
    id: string
    type: string
    provider: string
    status: string
    startedAt: string
  }>
  latestReport: { id: string; weekStart: string; createdAt: string } | null
}

export default function DashboardHome() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const ads = data?.ads || { activeCampaigns: 0, totalCampaigns: 0, totalSpend: 0, totalRevenue: 0, roas: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0 }
  const seo = data?.seo || { totalKeywords: 0, top10Keywords: 0, top3Keywords: 0, avgRank: 0, contentInProgress: 0, contentIdeas: 0 }
  const sales = data?.sales || { totalLeads: 0, hotLeads: 0, pipelineValue: 0, wonDeals: 0, wonValue: 0, totalProposals: 0, dueFollowUps: 0 }
  const ai = data?.ai || { totalTokens: 0, totalCost: 0, calls: 0, providers: { claude: 0, openai: 0, gemini: 0 } }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Alle KPIs auf einen Blick</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/reports')}>
          <Sparkles className="w-4 h-4 mr-2" />Wochenbericht
        </Button>
      </div>

      <InfoBox title="Willkommen bei MarketFlow AI" variant="ai" storageKey="dashboard-welcome">
        <p>Dein KI-gesteuertes Marketing- & Sales-Cockpit. Hier siehst du alle KPIs auf einen Blick.</p>
        <ul>
          <li><strong>Performance Ads</strong> - Google/Meta Kampagnen verwalten, KI-Budgetoptimierung</li>
          <li><strong>SEO & Analytics</strong> - Keywords tracken, Content planen, SEO-Audits mit KI</li>
          <li><strong>Sales Intelligence</strong> - Leads verwalten, KI-Scoring, Pipeline & Proposals</li>
          <li><strong>KI-Assistent</strong> - Frag die KI zu allen Marketing- & Sales-Themen</li>
          <li><strong>Multi-KI</strong> - Claude, GPT-4o und Gemini arbeiten zusammen</li>
        </ul>
        <p className="mt-2">Klicke auf ein Modul-Karte unten, um direkt einzusteigen.</p>
      </InfoBox>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Ad Spend (30 Tage)"
          value={`${ads.totalSpend.toLocaleString('de-DE', { minimumFractionDigits: 2 })}€`}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <KpiCard
          title="ROAS"
          value={`${ads.roas.toFixed(2)}x`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KpiCard
          title="Pipeline-Wert"
          value={`${sales.pipelineValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}€`}
          icon={<Target className="w-5 h-5" />}
        />
        <KpiCard
          title="Leads gesamt"
          value={String(sales.totalLeads)}
          icon={<UserPlus className="w-5 h-5" />}
        />
      </div>

      {/* Module Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ads Module */}
        <Card className="cursor-pointer hover:border-orange-500/50 transition" onClick={() => router.push('/dashboard/ads')}>
          <CardHeader className="flex flex-row items-center gap-2">
            <Megaphone className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Performance Ads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Aktive Kampagnen</span>
              <Badge variant="secondary">{ads.activeCampaigns}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ROAS</span>
              <span className={`font-medium ${ads.roas >= 2 ? 'text-green-500' : ads.roas > 0 ? 'text-yellow-500' : ''}`}>
                {ads.roas.toFixed(2)}x
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">CTR</span>
              <span className="font-medium">{ads.ctr.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Conversions</span>
              <span className="font-medium">{ads.conversions}</span>
            </div>
          </CardContent>
        </Card>

        {/* SEO Module */}
        <Card className="cursor-pointer hover:border-green-500/50 transition" onClick={() => router.push('/dashboard/seo')}>
          <CardHeader className="flex flex-row items-center gap-2">
            <Search className="w-5 h-5 text-green-500" />
            <CardTitle className="text-lg">SEO & Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Getrackte Keywords</span>
              <Badge variant="secondary">{seo.totalKeywords}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Top 10 Rankings</span>
              <span className="font-medium text-green-500">{seo.top10Keywords}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Top 3 Rankings</span>
              <span className="font-medium text-green-500">{seo.top3Keywords}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Content</span>
              <Badge className="bg-green-500/10 text-green-500">{seo.contentIdeas} Ideen | {seo.contentInProgress} in Arbeit</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Sales Module */}
        <Card className="cursor-pointer hover:border-purple-500/50 transition" onClick={() => router.push('/dashboard/sales')}>
          <CardHeader className="flex flex-row items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg">Sales Intelligence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pipeline-Wert</span>
              <span className="font-bold">{sales.pipelineValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}€</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hot Leads (Score 70+)</span>
              <Badge className="bg-red-500/10 text-red-500">{sales.hotLeads}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gewonnene Deals</span>
              <span className="font-medium text-green-500">{sales.wonDeals} ({sales.wonValue.toLocaleString('de-DE')}€)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fällige Follow-ups</span>
              <Badge className={sales.dueFollowUps > 0 ? 'bg-purple-500/10 text-purple-500' : ''}>
                {sales.dueFollowUps} fällig
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KI + Sync Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KI-Nutzung */}
        <Card className="cursor-pointer hover:border-cyan-500/50 transition" onClick={() => router.push('/dashboard/ai-usage')}>
          <CardHeader className="flex flex-row items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-500" />
            <CardTitle>KI-Nutzung (7 Tage)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">KI-Aufrufe</span>
              <span className="font-medium">{ai.calls}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tokens verbraucht</span>
              <span className="font-medium">{ai.totalTokens.toLocaleString('de-DE')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Provider-Verteilung</span>
              <div className="flex gap-1">
                {ai.providers.claude > 0 && <Badge variant="outline" className="text-xs">Claude: {ai.providers.claude}</Badge>}
                {ai.providers.openai > 0 && <Badge variant="outline" className="text-xs">OpenAI: {ai.providers.openai}</Badge>}
                {ai.providers.gemini > 0 && <Badge variant="outline" className="text-xs">Gemini: {ai.providers.gemini}</Badge>}
                {ai.calls === 0 && <span className="text-xs text-muted-foreground">Noch keine Aufrufe</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync Status */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <CardTitle>Letzte Synchronisierungen</CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.syncs?.length ? (
              <p className="text-muted-foreground text-sm text-center py-4">Noch keine Syncs durchgeführt.</p>
            ) : (
              <div className="space-y-2">
                {data.syncs.map((sync) => (
                  <div key={sync.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      {sync.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : sync.status === 'error' ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                      )}
                      <span className="text-sm">{sync.type} ({sync.provider})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(sync.startedAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
