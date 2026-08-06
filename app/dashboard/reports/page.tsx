'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { InfoBox } from '../components/info-box'

interface Report {
  id: string
  weekStart: string
  content: string
  metrics: Record<string, unknown> | null
  createdAt: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    const res = await fetch('/api/reports')
    if (res.ok) setReports(await res.json())
    setLoading(false)
  }

  async function generateReport() {
    setGenerating(true)
    const res = await fetch('/api/reports', { method: 'POST' })
    if (res.ok) {
      await fetchReports()
    }
    setGenerating(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wochenberichte</h1>
          <p className="text-muted-foreground mt-1">KI-generierte Cross-Modul Reports</p>
        </div>
        <Button onClick={generateReport} disabled={generating}>
          {generating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generiere...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />Neuen Bericht erstellen</>
          )}
        </Button>
      </div>

      <InfoBox title="KI-Wochenberichte" variant="ai" storageKey="reports-tip">
        <p>Die KI erstellt einen umfassenden Wochenbericht ueber alle 3 Module (Ads, SEO, Sales). Klicke <strong>Neuen Bericht erstellen</strong> oder warte auf den automatischen Bericht jeden <strong>Montag um 09:00</strong>. Der Bericht enthaelt: Performance-Zusammenfassung, Highlights, Probleme und konkrete Handlungsempfehlungen.</p>
      </InfoBox>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Noch keine Wochenberichte.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Klicke auf &quot;Neuen Bericht erstellen&quot; oder warte auf den automatischen Montags-Bericht.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const weekStart = new Date(report.weekStart)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 6)
            const isExpanded = expanded === report.id

            return (
              <Card key={report.id}>
                <CardHeader
                  className="cursor-pointer hover:bg-muted/30 transition"
                  onClick={() => setExpanded(isExpanded ? null : report.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-cyan-500" />
                      <div>
                        <CardTitle className="text-lg">
                          KW {getWeekNumber(weekStart)} / {weekStart.getFullYear()}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {weekStart.toLocaleDateString('de-DE')} - {weekEnd.toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {new Date(report.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </Badge>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    <div className="prose prose-sm prose-invert max-w-none">
                      {report.content.split('\n').map((line, i) => {
                        if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h1>
                        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mt-3 mb-1">{line.slice(3)}</h2>
                        if (line.startsWith('### ')) return <h3 key={i} className="text-base font-medium mt-2 mb-1">{line.slice(4)}</h3>
                        if (line.startsWith('- ')) return <li key={i} className="text-sm text-muted-foreground ml-4">{line.slice(2)}</li>
                        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-sm font-semibold">{line.slice(2, -2)}</p>
                        if (line.trim() === '') return <br key={i} />
                        return <p key={i} className="text-sm text-muted-foreground">{line}</p>
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
