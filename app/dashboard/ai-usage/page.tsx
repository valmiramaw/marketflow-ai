'use client'

import { useState, useEffect } from 'react'
import { KpiCard } from '../components/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Cpu, Zap, Clock, AlertTriangle } from 'lucide-react'
import { InfoBox } from '../components/info-box'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface UsageData {
  summary: {
    totalCalls: number
    totalTokens: number
    totalCost: number
    avgDuration: number
    errorRate: number
    period: string
  }
  byProvider: Array<{
    provider: string
    calls: number
    tokens: number
    cost: number
    avgDuration: number
    errors: number
  }>
  byTaskType: Array<{
    taskType: string
    calls: number
    tokens: number
    cost: number
  }>
  daily: Array<{
    date: string
    calls: number
    tokens: number
    cost: number
  }>
  recent: Array<{
    id: string
    provider: string
    model: string
    taskType: string
    tokens: number
    cost: number
    duration: number
    success: boolean
    error: string | null
    createdAt: string
  }>
}

const providerColors: Record<string, string> = {
  claude: 'bg-orange-500',
  openai: 'bg-green-500',
  gemini: 'bg-blue-500',
}

const providerLabels: Record<string, string> = {
  claude: 'Anthropic Claude',
  openai: 'OpenAI GPT-4o',
  gemini: 'Google Gemini',
}

const taskTypeLabels: Record<string, string> = {
  chat: 'Chat',
  content_generation: 'Content',
  strategy_analysis: 'Strategie',
  report_generation: 'Reports',
  proposal_writing: 'Proposals',
  seo_content: 'SEO Content',
  lead_scoring: 'Lead-Scoring',
  data_extraction: 'Daten-Extraktion',
  json_generation: 'JSON',
  classification: 'Klassifikation',
  keyword_analysis: 'Keywords',
  image_analysis: 'Bild-Analyse',
  bulk_analysis: 'Bulk',
  creative_review: 'Creative-Review',
}

export default function AiUsagePage() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/ai/usage?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [days])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  const summary = data?.summary || { totalCalls: 0, totalTokens: 0, totalCost: 0, avgDuration: 0, errorRate: 0, period: '' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">KI-Nutzung</h1>
          <p className="text-muted-foreground mt-1">Token-Verbrauch, Kosten & Provider-Verteilung</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded-md text-sm ${days === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {d} Tage
            </button>
          ))}
        </div>
      </div>

      <InfoBox title="Multi-KI System" storageKey="ai-usage-info">
        <p>MarketFlow nutzt 3 KI-Provider, automatisch geroutet nach Aufgabentyp:</p>
        <ul>
          <li><strong>Claude (Bedrock)</strong> - Strategie, Content, Reports, Chat, Proposals</li>
          <li><strong>GPT-4o</strong> - Lead-Scoring, Daten-Extraktion, JSON, Keyword-Analyse</li>
          <li><strong>Gemini</strong> - Bild-Analyse (Vision), Bulk-Verarbeitung, Creative-Reviews</li>
        </ul>
        <p className="mt-1">Automatischer Fallback: Faellt ein Provider aus, uebernimmt der naechste.</p>
      </InfoBox>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="KI-Aufrufe" value={String(summary.totalCalls)} icon={<Zap className="w-5 h-5" />} />
        <KpiCard title="Tokens verbraucht" value={summary.totalTokens.toLocaleString('de-DE')} icon={<Cpu className="w-5 h-5" />} />
        <KpiCard title="Avg. Antwortzeit" value={`${(summary.avgDuration / 1000).toFixed(1)}s`} icon={<Clock className="w-5 h-5" />} />
        <KpiCard title="Fehlerrate" value={`${summary.errorRate.toFixed(1)}%`} icon={<AlertTriangle className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider-Verteilung */}
        <Card>
          <CardHeader>
            <CardTitle>Provider-Verteilung</CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.byProvider?.length || summary.totalCalls === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">Noch keine KI-Aufrufe.</p>
            ) : (
              <div className="space-y-4">
                {data.byProvider.filter((p) => p.calls > 0).map((p) => {
                  const percentage = summary.totalCalls > 0 ? (p.calls / summary.totalCalls) * 100 : 0
                  return (
                    <div key={p.provider}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{providerLabels[p.provider] || p.provider}</span>
                        <span className="text-sm text-muted-foreground">{p.calls} Aufrufe ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${providerColors[p.provider] || 'bg-gray-500'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{p.tokens.toLocaleString('de-DE')} Tokens</span>
                        <span>{p.avgDuration}ms avg.</span>
                        {p.errors > 0 && <span className="text-red-500">{p.errors} Fehler</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aufgaben-Verteilung */}
        <Card>
          <CardHeader>
            <CardTitle>Aufgaben-Verteilung</CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.byTaskType?.length ? (
              <p className="text-muted-foreground text-center py-8 text-sm">Noch keine Aufrufe.</p>
            ) : (
              <div className="space-y-2">
                {data.byTaskType.map((t) => (
                  <div key={t.taskType} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-sm">{taskTypeLabels[t.taskType] || t.taskType}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{t.tokens.toLocaleString('de-DE')} Tokens</span>
                      <Badge variant="secondary">{t.calls}x</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {data?.daily && data.daily.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Tägliche Aufrufe</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.daily.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => new Date(v).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(v) => new Date(String(v)).toLocaleDateString('de-DE')} />
                  <Area type="monotone" dataKey="calls" stroke="#0891b2" fill="#0891b2" fillOpacity={0.15} strokeWidth={2} name="Aufrufe" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Token-Verbrauch</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.daily.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => new Date(v).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                  <Tooltip labelFormatter={(v) => new Date(String(v)).toLocaleDateString('de-DE')} />
                  <Area type="monotone" dataKey="tokens" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} name="Tokens" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Task-Verteilung Pie */}
      {data?.byTaskType && data.byTaskType.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Aufgaben-Verteilung (Calls)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.byTaskType.filter(t => t.calls > 0)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="taskType" type="category" tick={{ fontSize: 11 }} width={120} tickFormatter={(v) => taskTypeLabels[v] || v} />
                <Tooltip />
                <Bar dataKey="calls" fill="#0891b2" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Letzte Aufrufe */}
      {data?.recent && data.recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Letzte KI-Aufrufe</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground">Provider</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Aufgabe</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Tokens</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Dauer</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Zeit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">{r.provider}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{taskTypeLabels[r.taskType] || r.taskType}</td>
                      <td className="p-3 text-right">{r.tokens.toLocaleString('de-DE')}</td>
                      <td className="p-3 text-right">{(r.duration / 1000).toFixed(1)}s</td>
                      <td className="p-3 text-right">
                        {r.success ? (
                          <Badge className="bg-green-500/10 text-green-500 text-xs">OK</Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-500 text-xs">Fehler</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
