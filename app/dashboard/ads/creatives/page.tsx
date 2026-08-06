'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Plus, Loader2, Trash2, Sparkles, Image, Type, Video, LayoutGrid,
  ExternalLink,
} from 'lucide-react'
import { InfoBox } from '../../components/info-box'

interface Creative {
  id: string
  type: string
  headline: string
  description: string
  imageUrl: string | null
  landingUrl: string | null
  status: string
  aiAnalysis: string | null
  adGroup: {
    campaign: {
      id: string
      name: string
      platform: string
    }
  }
}

interface Campaign {
  id: string
  name: string
  platform: string
}

interface AnalysisData {
  score?: number
  visualImpact?: { score: number; feedback: string }
  textQuality?: { score: number; feedback: string }
  callToAction?: { score: number; feedback: string }
  improvements?: string[]
  alternativeHeadlines?: string[]
}

export default function CreativesPage() {
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(null)
  const [newCreative, setNewCreative] = useState({
    campaignId: '',
    type: 'text',
    headline: '',
    description: '',
    imageUrl: '',
    landingUrl: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/ads/creatives').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/ads/campaigns').then((r) => (r.ok ? r.json() : [])),
    ]).then(([c, camps]) => {
      setCreatives(c)
      setCampaigns(camps)
    }).finally(() => setLoading(false))
  }, [])

  async function fetchCreatives() {
    const res = await fetch('/api/ads/creatives')
    if (res.ok) setCreatives(await res.json())
  }

  async function createCreative() {
    setCreating(true)
    const res = await fetch('/api/ads/creatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newCreative,
        analyze: !!newCreative.imageUrl,
      }),
    })
    if (res.ok) {
      setShowCreate(false)
      setNewCreative({ campaignId: '', type: 'text', headline: '', description: '', imageUrl: '', landingUrl: '' })
      fetchCreatives()
    }
    setCreating(false)
  }

  async function analyzeCreative(id: string) {
    setAnalyzing(id)
    const res = await fetch(`/api/ads/creatives/${id}`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setSelectedAnalysis(data)
      fetchCreatives()
    }
    setAnalyzing(null)
  }

  async function deleteCreative(id: string) {
    await fetch(`/api/ads/creatives/${id}`, { method: 'DELETE' })
    fetchCreatives()
  }

  function viewAnalysis(creative: Creative) {
    if (creative.aiAnalysis) {
      try {
        setSelectedAnalysis(JSON.parse(creative.aiAnalysis))
      } catch {
        setSelectedAnalysis(null)
      }
    }
  }

  const typeIcons: Record<string, React.ReactNode> = {
    text: <Type className="w-4 h-4" />,
    image: <Image className="w-4 h-4" />,
    video: <Video className="w-4 h-4" />,
    carousel: <LayoutGrid className="w-4 h-4" />,
  }

  const typeLabels: Record<string, string> = {
    text: 'Text',
    image: 'Bild',
    video: 'Video',
    carousel: 'Carousel',
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Werbemittel</h1>
          <p className="text-muted-foreground mt-1">KI-Analyse von Creatives (Gemini Vision)</p>
        </div>
        <Button onClick={() => setShowCreate(true)} disabled={campaigns.length === 0}>
          <Plus className="w-4 h-4 mr-2" />Neues Creative
        </Button>
      </div>

      <InfoBox title="Gemini Vision - Bild-Analyse" variant="ai" storageKey="creatives-tip">
        <p>Lade Creatives mit einer <strong>Bild-URL</strong> hoch. Google Gemini analysiert das Bild automatisch und bewertet: visuelle Qualitaet, CTA-Staerke, Text-Lesbarkeit und gibt einen Score (0-100). Klicke <strong>Sparkles</strong> fuer eine erneute Analyse.</p>
      </InfoBox>

      {creatives.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Image className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {campaigns.length === 0
                ? 'Erstelle zuerst eine Kampagne, um Creatives hinzuzufügen.'
                : 'Noch keine Creatives. Erstelle ein Creative für eine KI-gestützte Analyse.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creatives.map((c) => {
            let analysis: AnalysisData | null = null
            if (c.aiAnalysis) {
              try { analysis = JSON.parse(c.aiAnalysis) } catch { analysis = null }
            }

            return (
              <Card key={c.id} className="overflow-hidden">
                {c.imageUrl && (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <Image className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {typeIcons[c.type]}
                      <Badge variant="outline" className="text-xs">{typeLabels[c.type] || c.type}</Badge>
                    </div>
                    {analysis?.score !== undefined && (
                      <Badge className={
                        analysis.score >= 70 ? 'bg-green-500/10 text-green-500'
                          : analysis.score >= 40 ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-red-500/10 text-red-500'
                      }>
                        {analysis.score}/100
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-sm">{c.headline || 'Keine Headline'}</p>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {c.adGroup.campaign.name} ({{ google: 'Google', meta: 'Meta', tiktok: 'TikTok', snapchat: 'Snapchat' }[c.adGroup.campaign.platform] || c.adGroup.campaign.platform})
                  </p>

                  {c.landingUrl && (
                    <div className="flex items-center gap-1 mt-1">
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">{c.landingUrl}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => analyzeCreative(c.id)}
                      disabled={analyzing === c.id}
                    >
                      {analyzing === c.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      Analysieren
                    </Button>
                    {analysis && (
                      <Button variant="ghost" size="sm" onClick={() => viewAnalysis(c)}>
                        Details
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteCreative(c.id)}>
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Analyse-Detail Dialog */}
      {selectedAnalysis && (
        <Dialog open={!!selectedAnalysis} onOpenChange={() => setSelectedAnalysis(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />Creative-Analyse (Gemini Vision)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedAnalysis.score !== undefined && (
                <div className="text-center">
                  <div className={`text-4xl font-bold ${
                    selectedAnalysis.score >= 70 ? 'text-green-500'
                      : selectedAnalysis.score >= 40 ? 'text-yellow-500'
                        : 'text-red-500'
                  }`}>
                    {selectedAnalysis.score}/100
                  </div>
                  <p className="text-sm text-muted-foreground">Gesamt-Score</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {selectedAnalysis.visualImpact && (
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{selectedAnalysis.visualImpact.score}</p>
                    <p className="text-xs text-muted-foreground">Visuell</p>
                  </div>
                )}
                {selectedAnalysis.textQuality && (
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{selectedAnalysis.textQuality.score}</p>
                    <p className="text-xs text-muted-foreground">Text</p>
                  </div>
                )}
                {selectedAnalysis.callToAction && (
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{selectedAnalysis.callToAction.score}</p>
                    <p className="text-xs text-muted-foreground">CTA</p>
                  </div>
                )}
              </div>

              {selectedAnalysis.improvements?.length ? (
                <div>
                  <p className="text-sm font-medium mb-2">Verbesserungsvorschläge</p>
                  <ul className="space-y-1">
                    {selectedAnalysis.improvements.map((i, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {i}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedAnalysis.alternativeHeadlines?.length ? (
                <div>
                  <p className="text-sm font-medium mb-2">Alternative Headlines</p>
                  <ul className="space-y-1">
                    {selectedAnalysis.alternativeHeadlines.map((h, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground p-2 rounded bg-muted/50">"{h}"</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Neues Creative Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Creative</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Kampagne</label>
              <select
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newCreative.campaignId}
                onChange={(e) => setNewCreative((s) => ({ ...s, campaignId: e.target.value }))}
              >
                <option value="">Kampagne wählen...</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.platform})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Typ</label>
              <select
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newCreative.type}
                onChange={(e) => setNewCreative((s) => ({ ...s, type: e.target.value }))}
              >
                <option value="text">Text-Anzeige</option>
                <option value="image">Bild-Anzeige</option>
                <option value="video">Video-Anzeige</option>
                <option value="carousel">Carousel</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Headline</label>
              <Input
                value={newCreative.headline}
                onChange={(e) => setNewCreative((s) => ({ ...s, headline: e.target.value }))}
                placeholder="z.B. Jetzt 20% sparen"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Beschreibung</label>
              <Input
                value={newCreative.description}
                onChange={(e) => setNewCreative((s) => ({ ...s, description: e.target.value }))}
                placeholder="Anzeigentext..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bild-URL (optional)</label>
              <Input
                value={newCreative.imageUrl}
                onChange={(e) => setNewCreative((s) => ({ ...s, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Landing Page URL (optional)</label>
              <Input
                value={newCreative.landingUrl}
                onChange={(e) => setNewCreative((s) => ({ ...s, landingUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <Button
              onClick={createCreative}
              disabled={!newCreative.campaignId || !newCreative.headline || creating}
              className="w-full"
            >
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Creative erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
