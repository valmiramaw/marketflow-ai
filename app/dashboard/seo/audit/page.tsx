'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Search, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react'
import { InfoBox } from '../../components/info-box'
import { cn } from '@/lib/utils'
import { useToast } from '../../components/toast'

interface SeoAudit {
  id: string
  domain: string
  score: number | null
  issues: { critical: string[]; warning: string[]; info: string[] } | null
  performance: { lcp: string; fid: string; cls: string; ttfb: string } | null
  aiSummary: string | null
  createdAt: string
}

export default function AuditPage() {
  const [audits, setAudits] = useState<SeoAudit[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [domain, setDomain] = useState('')
  const { toast } = useToast()

  useEffect(() => { fetchAudits() }, [])

  async function fetchAudits() {
    try {
      const res = await fetch('/api/seo/audit')
      if (res.ok) setAudits(await res.json())
    } catch {
      toast('Audits konnten nicht geladen werden.', 'error')
    } finally { setLoading(false) }
  }

  async function runAudit(e: React.FormEvent) {
    e.preventDefault()
    if (!domain.trim() || running) return
    setRunning(true)
    try {
      const res = await fetch('/api/seo/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      })
      if (res.ok) {
        setDomain('')
        fetchAudits()
        toast('Audit abgeschlossen!', 'success')
      } else {
        toast('Audit konnte nicht durchgeführt werden.', 'error')
      }
    } catch {
      toast('Verbindungsfehler.', 'error')
    } finally { setRunning(false) }
  }

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SEO-Audit</h1>
        <p className="text-muted-foreground mt-1">KI-gestützte technische SEO-Analyse</p>
      </div>

      <InfoBox title="KI SEO-Audit" variant="ai" storageKey="audit-tip">
        <p>Gib eine Domain ein und klicke <strong>Audit starten</strong>. Die KI analysiert: technische SEO-Probleme (kritisch/warnung/info), gibt einen Score (0-100) und schlaegt konkrete Verbesserungen vor. Jeder Audit wird gespeichert, so kannst du Fortschritte ueber die Zeit verfolgen.</p>
      </InfoBox>

      {/* Audit starten */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={runAudit} className="flex gap-3">
            <div className="flex-1">
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Domain eingeben (z.B. example.com)"
                disabled={running}
              />
            </div>
            <Button type="submit" disabled={!domain.trim() || running}>
              {running ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analysiere...</>
              ) : (
                <><Search className="w-4 h-4 mr-2" />Audit starten</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Audit-Ergebnisse */}
      {audits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Noch keine Audits. Starte dein erstes SEO-Audit.</p>
          </CardContent>
        </Card>
      ) : (
        audits.map((audit) => (
          <Card key={audit.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{audit.domain}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(audit.createdAt).toLocaleString('de-DE')}
                  </p>
                </div>
                {audit.score !== null && (
                  <div className="text-center">
                    <div className={cn('text-3xl font-bold', getScoreColor(audit.score))}>
                      {audit.score}
                    </div>
                    <p className="text-xs text-muted-foreground">/ 100</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Zusammenfassung */}
              {audit.aiSummary && (
                <p className="text-sm text-muted-foreground">{audit.aiSummary}</p>
              )}

              {/* Core Web Vitals */}
              {audit.performance && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Core Web Vitals</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(audit.performance).map(([key, value]) => (
                      <div key={key} className="p-3 rounded-lg bg-muted/50 text-center">
                        <p className="text-xs text-muted-foreground uppercase">{key}</p>
                        <p className="text-sm font-medium mt-1">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Issues */}
              {audit.issues && (
                <div className="space-y-3">
                  {audit.issues.critical?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-red-500">Kritisch ({audit.issues.critical.length})</span>
                      </div>
                      <ul className="space-y-1">
                        {audit.issues.critical.map((issue, i) => (
                          <li key={i} className="text-sm text-muted-foreground pl-6">• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {audit.issues.warning?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-yellow-500">Warnungen ({audit.issues.warning.length})</span>
                      </div>
                      <ul className="space-y-1">
                        {audit.issues.warning.map((issue, i) => (
                          <li key={i} className="text-sm text-muted-foreground pl-6">• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {audit.issues.info?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-500">Hinweise ({audit.issues.info.length})</span>
                      </div>
                      <ul className="space-y-1">
                        {audit.issues.info.map((issue, i) => (
                          <li key={i} className="text-sm text-muted-foreground pl-6">• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
