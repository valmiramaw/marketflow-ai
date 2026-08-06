'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Plus, Loader2, Trash2, Play, Pause, Sparkles, Search,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import { InfoBox } from '../../components/info-box'

interface Campaign {
  id: string
  name: string
  platform: string
  status: string
  objective: string | null
  budget: number | null
  budgetType: string
  totalSpend: number
  totalRevenue: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  roas: number
  ctr: number
  cpc: number
  aiScore: number | null
  adGroupCount: number
}

interface Analysis {
  score: number
  trend: string
  insights: string[]
  recommendations: string[]
  budgetSuggestion?: {
    action: string
    amount: number
    reason: string
  }
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    platform: 'google',
    objective: '',
    budget: '',
    budgetType: 'daily',
  })
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<{ id: string; data: Analysis } | null>(null)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  async function fetchCampaigns() {
    const res = await fetch('/api/ads/campaigns')
    if (res.ok) setCampaigns(await res.json())
    setLoading(false)
  }

  async function createCampaign() {
    setCreating(true)
    const res = await fetch('/api/ads/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCampaign),
    })
    if (res.ok) {
      setShowCreate(false)
      setNewCampaign({ name: '', platform: 'google', objective: '', budget: '', budgetType: 'daily' })
      fetchCampaigns()
    }
    setCreating(false)
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/ads/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchCampaigns()
  }

  async function deleteCampaign(id: string) {
    await fetch(`/api/ads/campaigns/${id}`, { method: 'DELETE' })
    fetchCampaigns()
  }

  async function analyzeCampaign(id: string) {
    setAnalyzing(id)
    const res = await fetch(`/api/ads/campaigns/${id}/analyze`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setAnalysis({ id, data })
      fetchCampaigns()
    }
    setAnalyzing(null)
  }

  const filtered = campaigns.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-500',
    paused: 'bg-yellow-500/10 text-yellow-500',
    draft: 'bg-gray-500/10 text-gray-400',
    ended: 'bg-red-500/10 text-red-500',
  }

  const statusLabels: Record<string, string> = {
    active: 'Aktiv',
    paused: 'Pausiert',
    draft: 'Entwurf',
    ended: 'Beendet',
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kampagnen</h1>
          <p className="text-muted-foreground mt-1">Alle Werbekampagnen verwalten</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />Neue Kampagne
        </Button>
      </div>

      <InfoBox title="KI-Kampagnenanalyse" variant="ai" storageKey="campaigns-tip">
        <p>Klicke auf das <strong>Sparkles-Icon</strong> bei einer Kampagne, um eine KI-Analyse zu starten. Du bekommst: Performance-Score, Trend-Bewertung, konkrete Insights und Budget-Empfehlungen.</p>
      </InfoBox>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Kampagne suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {campaigns.length === 0
                ? 'Noch keine Kampagnen. Erstelle deine erste Kampagne oder verbinde Google Ads.'
                : 'Keine Kampagnen gefunden.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Plattform</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Budget</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Ausgaben</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">ROAS</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">KI-Score</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.totalClicks} Klicks | {c.totalConversions} Conv. | CTR {c.ctr.toFixed(2)}%
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{c.platform === 'google' ? 'Google' : 'Meta'}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={statusColors[c.status] || ''}>
                          {statusLabels[c.status] || c.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        {c.budget ? `${c.budget.toFixed(2)}€/${c.budgetType === 'daily' ? 'Tag' : 'Gesamt'}` : '—'}
                      </td>
                      <td className="p-4 text-right">{c.totalSpend.toFixed(2)}€</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.roas >= 3 ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : c.roas >= 1 ? (
                            <Minus className="w-3 h-3 text-yellow-500" />
                          ) : c.roas > 0 ? (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          ) : null}
                          {c.roas.toFixed(2)}x
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {c.aiScore !== null ? (
                          <Badge className={
                            c.aiScore >= 70 ? 'bg-green-500/10 text-green-500'
                              : c.aiScore >= 40 ? 'bg-yellow-500/10 text-yellow-500'
                                : 'bg-red-500/10 text-red-500'
                          }>
                            {c.aiScore}/100
                          </Badge>
                        ) : '—'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          {c.status === 'active' ? (
                            <Button variant="ghost" size="icon" onClick={() => updateStatus(c.id, 'paused')} title="Pausieren">
                              <Pause className="w-4 h-4" />
                            </Button>
                          ) : c.status !== 'ended' ? (
                            <Button variant="ghost" size="icon" onClick={() => updateStatus(c.id, 'active')} title="Aktivieren">
                              <Play className="w-4 h-4" />
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => analyzeCampaign(c.id)}
                            disabled={analyzing === c.id}
                            title="KI-Analyse"
                          >
                            {analyzing === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteCampaign(c.id)} title="Löschen">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KI-Analyse Modal */}
      {analysis && (
        <Dialog open={!!analysis} onOpenChange={() => setAnalysis(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />KI-Analyse
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${
                    analysis.data.score >= 70 ? 'text-green-500'
                      : analysis.data.score >= 40 ? 'text-yellow-500'
                        : 'text-red-500'
                  }`}>
                    {analysis.data.score}
                  </div>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
                <Badge variant="outline">{analysis.data.trend === 'up' ? 'Aufwärts' : analysis.data.trend === 'down' ? 'Abwärts' : 'Stabil'}</Badge>
              </div>

              {analysis.data.insights?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Erkenntnisse</p>
                  <ul className="space-y-1">
                    {analysis.data.insights.map((i, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {i}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.data.recommendations?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Empfehlungen</p>
                  <ul className="space-y-1">
                    {analysis.data.recommendations.map((r, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.data.budgetSuggestion && (
                <div className="p-3 rounded-lg border bg-muted/50">
                  <p className="text-sm font-medium">Budget-Empfehlung: {analysis.data.budgetSuggestion.action === 'increase' ? 'Erhöhen' : analysis.data.budgetSuggestion.action === 'decrease' ? 'Reduzieren' : 'Beibehalten'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{analysis.data.budgetSuggestion.reason}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Neue Kampagne Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Kampagne</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newCampaign.name}
                onChange={(e) => setNewCampaign((s) => ({ ...s, name: e.target.value }))}
                placeholder="z.B. Brand Awareness Q3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Plattform</label>
                <select
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newCampaign.platform}
                  onChange={(e) => setNewCampaign((s) => ({ ...s, platform: e.target.value }))}
                >
                  <option value="google">Google Ads</option>
                  <option value="meta">Meta Ads</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Ziel</label>
                <select
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newCampaign.objective}
                  onChange={(e) => setNewCampaign((s) => ({ ...s, objective: e.target.value }))}
                >
                  <option value="">Auswählen...</option>
                  <option value="awareness">Brand Awareness</option>
                  <option value="traffic">Traffic</option>
                  <option value="leads">Lead Generation</option>
                  <option value="sales">Sales / Conversions</option>
                  <option value="retargeting">Retargeting</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Budget (€)</label>
                <Input
                  type="number"
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign((s) => ({ ...s, budget: e.target.value }))}
                  placeholder="z.B. 50"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Budget-Typ</label>
                <select
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newCampaign.budgetType}
                  onChange={(e) => setNewCampaign((s) => ({ ...s, budgetType: e.target.value }))}
                >
                  <option value="daily">Tagesbudget</option>
                  <option value="lifetime">Gesamtbudget</option>
                </select>
              </div>
            </div>
            <Button onClick={createCampaign} disabled={!newCampaign.name || creating} className="w-full">
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Kampagne erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
