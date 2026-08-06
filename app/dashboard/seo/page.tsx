'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { KpiCard } from '../components/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Globe, TrendingUp, FileText, AlertCircle } from 'lucide-react'
import { InfoBox } from '../components/info-box'

interface Keyword {
  id: string
  keyword: string
  currentRank: number | null
  searchVolume: number | null
}

interface ContentPlan {
  id: string
  title: string
  status: string
  keyword: string | null
}

interface Audit {
  id: string
  domain: string
  score: number | null
  createdAt: string
}

export default function SeoPage() {
  const router = useRouter()
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [plans, setPlans] = useState<ContentPlan[]>([])
  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/seo/keywords').then((r) => r.ok ? r.json() : []),
      fetch('/api/seo/content').then((r) => r.ok ? r.json() : []),
      fetch('/api/seo/audit').then((r) => r.ok ? r.json() : []),
    ]).then(([k, c, a]) => {
      setKeywords(k)
      setPlans(c)
      setAudits(a)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  const top10 = keywords.filter((k) => k.currentRank && k.currentRank <= 10).length
  const totalKeywords = keywords.length
  const latestAudit = audits[0]
  const contentIdeas = plans.filter((p) => p.status === 'idea').length
  const contentWriting = plans.filter((p) => p.status === 'writing').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SEO & Analytics</h1>
        <p className="text-muted-foreground mt-1">Search Console, GA4 & Keyword-Tracking</p>
      </div>

      <InfoBox title="SEO & Analytics - So funktioniert's" variant="ai" storageKey="seo-intro">
        <p>Tracke deine Rankings, plane Content und analysiere Traffic mit KI.</p>
        <ul>
          <li><strong>Keywords</strong> - Trage Keywords ein, die du tracken willst. Rankings werden automatisch aktualisiert wenn Google Search Console verbunden ist</li>
          <li><strong>Content</strong> - Plane Blog-Posts, Landing Pages etc. Die KI generiert Entwuerfe basierend auf deinem Keyword</li>
          <li><strong>SEO-Audit</strong> - Lass die KI deine Domain analysieren: technische Probleme, Core Web Vitals, Verbesserungsvorschläge</li>
          <li><strong>Analytics</strong> - GA4-Traffic-Daten: Sessions, Nutzer, Bounce-Rate, Top-Seiten</li>
        </ul>
        <p className="mt-2">Verbinde Google unter Einstellungen fuer automatische Daten-Synchronisierung (taeglich 07:00).</p>
      </InfoBox>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Getrackte Keywords" value={String(totalKeywords)} icon={<Globe className="w-5 h-5" />} />
        <KpiCard title="Top 10 Rankings" value={String(top10)} icon={<TrendingUp className="w-5 h-5" />} />
        <KpiCard title="SEO-Score" value={latestAudit?.score ? `${latestAudit.score}/100` : '—'} icon={<FileText className="w-5 h-5" />} />
        <KpiCard title="Content in Arbeit" value={String(contentWriting)} icon={<AlertCircle className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Keywords */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Keywords</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/seo/keywords')}>Alle anzeigen</Button>
          </CardHeader>
          <CardContent>
            {keywords.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">Noch keine Keywords getrackt.</p>
            ) : (
              <div className="space-y-2">
                {keywords
                  .filter((k) => k.currentRank)
                  .sort((a, b) => (a.currentRank || 999) - (b.currentRank || 999))
                  .slice(0, 5)
                  .map((kw) => (
                    <div key={kw.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">{kw.keyword}</span>
                      <div className="flex items-center gap-2">
                        {kw.searchVolume && (
                          <span className="text-xs text-muted-foreground">{kw.searchVolume.toLocaleString('de-DE')} Vol.</span>
                        )}
                        <Badge variant="secondary">#{kw.currentRank}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Pipeline */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Content-Pipeline</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/seo/content')}>Alle anzeigen</Button>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">Noch keine Content-Pläne erstellt.</p>
            ) : (
              <div className="space-y-2">
                {plans.slice(0, 5).map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{plan.title}</p>
                      {plan.keyword && <p className="text-xs text-muted-foreground">{plan.keyword}</p>}
                    </div>
                    <Badge variant="outline" className="text-xs">{plan.status}</Badge>
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
