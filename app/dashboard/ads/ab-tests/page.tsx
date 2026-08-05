'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Loader2, Trash2, Sparkles, CheckCircle, XCircle, Clock } from 'lucide-react'

interface AbTest {
  id: string
  name: string
  status: string
  variantA: Record<string, string>
  variantB: Record<string, string>
  winner: string | null
  confidence: number | null
  aiAnalysis: string | null
  startedAt: string | null
  endedAt: string | null
  campaign: {
    id: string
    name: string
    platform: string
  }
}

interface Campaign {
  id: string
  name: string
  platform: string
}

export default function AbTestsPage() {
  const [tests, setTests] = useState<AbTest[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [newTest, setNewTest] = useState({
    campaignId: '',
    name: '',
    variantALabel: '',
    variantAHeadline: '',
    variantBLabel: '',
    variantBHeadline: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/ads/ab-tests').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/ads/campaigns').then((r) => (r.ok ? r.json() : [])),
    ]).then(([t, c]) => {
      setTests(t)
      setCampaigns(c)
    }).finally(() => setLoading(false))
  }, [])

  async function fetchTests() {
    const res = await fetch('/api/ads/ab-tests')
    if (res.ok) setTests(await res.json())
  }

  async function createTest() {
    setCreating(true)
    const res = await fetch('/api/ads/ab-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: newTest.campaignId,
        name: newTest.name,
        variantA: { label: newTest.variantALabel, headline: newTest.variantAHeadline },
        variantB: { label: newTest.variantBLabel, headline: newTest.variantBHeadline },
      }),
    })
    if (res.ok) {
      setShowCreate(false)
      setNewTest({ campaignId: '', name: '', variantALabel: '', variantAHeadline: '', variantBLabel: '', variantBHeadline: '' })
      fetchTests()
    }
    setCreating(false)
  }

  async function completeTest(id: string, winner: string) {
    await fetch(`/api/ads/ab-tests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', winner }),
    })
    fetchTests()
  }

  async function analyzeTest(id: string) {
    setAnalyzing(id)
    await fetch(`/api/ads/ab-tests/${id}`, { method: 'POST' })
    await fetchTests()
    setAnalyzing(null)
  }

  async function deleteTest(id: string) {
    await fetch(`/api/ads/ab-tests/${id}`, { method: 'DELETE' })
    fetchTests()
  }

  const statusIcons: Record<string, React.ReactNode> = {
    running: <Clock className="w-3 h-3" />,
    completed: <CheckCircle className="w-3 h-3" />,
    cancelled: <XCircle className="w-3 h-3" />,
  }

  const statusColors: Record<string, string> = {
    running: 'bg-blue-500/10 text-blue-500',
    completed: 'bg-green-500/10 text-green-500',
    cancelled: 'bg-red-500/10 text-red-500',
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">A/B Tests</h1>
          <p className="text-muted-foreground mt-1">KI-gesteuerte Anzeigen-Tests</p>
        </div>
        <Button onClick={() => setShowCreate(true)} disabled={campaigns.length === 0}>
          <Plus className="w-4 h-4 mr-2" />Neuer Test
        </Button>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {campaigns.length === 0
                ? 'Erstelle zuerst eine Kampagne, um A/B Tests durchzuführen.'
                : 'Keine A/B Tests. Erstelle einen Test um Anzeigenvarianten zu vergleichen.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => {
            let analysisData: { analysis?: string; recommendation?: string } | null = null
            if (test.aiAnalysis) {
              try { analysisData = JSON.parse(test.aiAnalysis) } catch { analysisData = null }
            }

            return (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Kampagne: {test.campaign.name} ({test.campaign.platform === 'google' ? 'Google' : 'Meta'})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[test.status] || ''}>
                        {statusIcons[test.status]} <span className="ml-1">{test.status === 'running' ? 'Läuft' : test.status === 'completed' ? 'Abgeschlossen' : 'Abgebrochen'}</span>
                      </Badge>
                      {test.winner && (
                        <Badge className="bg-green-500/10 text-green-500">
                          Gewinner: {test.winner}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className={`p-4 rounded-lg border ${test.winner === 'A' ? 'border-green-500 bg-green-500/5' : 'bg-muted/30'}`}>
                      <p className="text-sm font-medium mb-1">Variante A{test.winner === 'A' && ' (Gewinner)'}</p>
                      {Object.entries(test.variantA || {}).map(([key, val]) => (
                        <p key={key} className="text-xs text-muted-foreground">{key}: {val}</p>
                      ))}
                    </div>
                    <div className={`p-4 rounded-lg border ${test.winner === 'B' ? 'border-green-500 bg-green-500/5' : 'bg-muted/30'}`}>
                      <p className="text-sm font-medium mb-1">Variante B{test.winner === 'B' && ' (Gewinner)'}</p>
                      {Object.entries(test.variantB || {}).map(([key, val]) => (
                        <p key={key} className="text-xs text-muted-foreground">{key}: {val}</p>
                      ))}
                    </div>
                  </div>

                  {test.confidence && (
                    <p className="text-sm text-muted-foreground mb-3">Konfidenz: {test.confidence}%</p>
                  )}

                  {analysisData && (
                    <div className="p-3 rounded-lg border bg-muted/30 mb-3">
                      <p className="text-sm font-medium flex items-center gap-1"><Sparkles className="w-3 h-3" /> KI-Analyse</p>
                      {analysisData.analysis && <p className="text-sm text-muted-foreground mt-1">{analysisData.analysis}</p>}
                      {analysisData.recommendation && <p className="text-sm text-muted-foreground mt-1"><strong>Empfehlung:</strong> {analysisData.recommendation}</p>}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {test.status === 'running' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => completeTest(test.id, 'A')}>
                          A gewinnt
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => completeTest(test.id, 'B')}>
                          B gewinnt
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => analyzeTest(test.id)}
                      disabled={analyzing === test.id}
                    >
                      {analyzing === test.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      KI-Analyse
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteTest(test.id)}>
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Neuer Test Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neuer A/B Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Kampagne</label>
              <select
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newTest.campaignId}
                onChange={(e) => setNewTest((s) => ({ ...s, campaignId: e.target.value }))}
              >
                <option value="">Kampagne wählen...</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.platform})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Testname</label>
              <Input
                value={newTest.name}
                onChange={(e) => setNewTest((s) => ({ ...s, name: e.target.value }))}
                placeholder="z.B. Headline-Test Q3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Variante A</p>
                <Input
                  value={newTest.variantALabel}
                  onChange={(e) => setNewTest((s) => ({ ...s, variantALabel: e.target.value }))}
                  placeholder="Label (z.B. Original)"
                />
                <Input
                  value={newTest.variantAHeadline}
                  onChange={(e) => setNewTest((s) => ({ ...s, variantAHeadline: e.target.value }))}
                  placeholder="Headline"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Variante B</p>
                <Input
                  value={newTest.variantBLabel}
                  onChange={(e) => setNewTest((s) => ({ ...s, variantBLabel: e.target.value }))}
                  placeholder="Label (z.B. Neu)"
                />
                <Input
                  value={newTest.variantBHeadline}
                  onChange={(e) => setNewTest((s) => ({ ...s, variantBHeadline: e.target.value }))}
                  placeholder="Headline"
                />
              </div>
            </div>
            <Button
              onClick={createTest}
              disabled={!newTest.campaignId || !newTest.name || creating}
              className="w-full"
            >
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Test starten
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
