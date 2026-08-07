'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '../../components/kpi-card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, Eye, Clock, ArrowDownUp } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface Snapshot {
  id: string
  date: string
  sessions: number
  users: number
  pageviews: number
  bounceRate: number | null
  avgDuration: number | null
  topPages: { path: string; views: number }[] | null
  topSources: { source: string; sessions: number }[] | null
}

export default function AnalyticsPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [googleConnected, setGoogleConnected] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/seo/analytics').then((r) => r.ok ? r.json() : []),
      fetch('/api/integrations/google').then((r) => r.ok ? r.json() : { connected: false }),
    ]).then(([s, g]) => {
      setSnapshots(s)
      setGoogleConnected(g.connected)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  const latest = snapshots[0]
  const previous = snapshots[1]

  function calcChange(curr: number | undefined, prev: number | undefined) {
    if (!curr || !prev || prev === 0) return undefined
    return Math.round(((curr - prev) / prev) * 100)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          GA4 Traffic-Daten
          {googleConnected ? (
            <Badge className="ml-2 bg-green-500/10 text-green-500">Google verbunden</Badge>
          ) : (
            <Badge className="ml-2 bg-yellow-500/10 text-yellow-500">Google nicht verbunden</Badge>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Sessions"
          value={latest ? latest.sessions.toLocaleString('de-DE') : '—'}
          change={calcChange(latest?.sessions, previous?.sessions)}
          icon={<Users className="w-5 h-5" />}
        />
        <KpiCard
          title="Pageviews"
          value={latest ? latest.pageviews.toLocaleString('de-DE') : '—'}
          change={calcChange(latest?.pageviews, previous?.pageviews)}
          icon={<Eye className="w-5 h-5" />}
        />
        <KpiCard
          title="Avg. Dauer"
          value={latest?.avgDuration ? `${Math.round(latest.avgDuration)}s` : '—'}
          icon={<Clock className="w-5 h-5" />}
        />
        <KpiCard
          title="Bounce Rate"
          value={latest?.bounceRate ? `${latest.bounceRate.toFixed(1)}%` : '—'}
          icon={<ArrowDownUp className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Top Seiten</CardTitle></CardHeader>
          <CardContent>
            {latest?.topPages && latest.topPages.length > 0 ? (
              <div className="space-y-2">
                {(latest.topPages as { path: string; views: number }[]).map((page, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium truncate flex-1">{page.path}</span>
                    <Badge variant="secondary">{page.views.toLocaleString('de-DE')}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">
                {googleConnected ? 'Keine Daten vorhanden. Sync wird automatisch durchgeführt.' : 'Verbinde Google Analytics in den Einstellungen.'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Traffic-Quellen</CardTitle></CardHeader>
          <CardContent>
            {latest?.topSources && latest.topSources.length > 0 ? (
              <div className="space-y-2">
                {(latest.topSources as { source: string; sessions: number }[]).map((src, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">{src.source}</span>
                    <Badge variant="secondary">{src.sessions.toLocaleString('de-DE')}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">
                {googleConnected ? 'Keine Daten vorhanden.' : 'Verbinde Google Analytics in den Einstellungen.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Traffic-Chart */}
      {snapshots.length > 2 && (
        <Card>
          <CardHeader><CardTitle>Traffic-Verlauf</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={snapshots.slice(0, 30).reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => new Date(v).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(v) => new Date(String(v)).toLocaleDateString('de-DE')} />
                <Legend />
                <Area type="monotone" dataKey="sessions" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} name="Sessions" />
                <Area type="monotone" dataKey="pageviews" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} name="Pageviews" />
                <Area type="monotone" dataKey="users" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} name="Users" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Verlauf */}
      {snapshots.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Tagesverlauf (letzte {snapshots.length} Tage)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground">Datum</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Sessions</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Users</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Pageviews</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Bounce</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.slice(0, 14).map((s) => (
                    <tr key={s.id} className="border-b border-border/50">
                      <td className="p-3">{new Date(s.date).toLocaleDateString('de-DE')}</td>
                      <td className="p-3 text-right">{s.sessions.toLocaleString('de-DE')}</td>
                      <td className="p-3 text-right">{s.users.toLocaleString('de-DE')}</td>
                      <td className="p-3 text-right">{s.pageviews.toLocaleString('de-DE')}</td>
                      <td className="p-3 text-right">{s.bounceRate ? `${s.bounceRate.toFixed(1)}%` : '—'}</td>
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
