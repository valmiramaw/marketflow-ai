'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Loader2, Sparkles, PenLine, Trash2, Eye, Lightbulb } from 'lucide-react'
import { InfoBox } from '../../components/info-box'

interface ContentSuggestion {
  title: string
  keyword: string
  contentType: string
  reason: string
}

interface ContentPlan {
  id: string
  title: string
  keyword: string | null
  status: string
  contentType: string
  outline: string | null
  aiDraft: string | null
  publishDate: string | null
  createdAt: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  idea: { label: 'Idee', color: 'bg-gray-500/10 text-gray-500' },
  planned: { label: 'Geplant', color: 'bg-blue-500/10 text-blue-500' },
  writing: { label: 'In Arbeit', color: 'bg-yellow-500/10 text-yellow-500' },
  published: { label: 'Veröffentlicht', color: 'bg-green-500/10 text-green-500' },
}

export default function ContentPage() {
  const [plans, setPlans] = useState<ContentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  useEffect(() => { fetchPlans() }, [])

  async function fetchPlans() {
    try {
      const res = await fetch('/api/seo/content')
      if (res.ok) setPlans(await res.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  async function createPlan(formData: FormData) {
    const res = await fetch('/api/seo/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formData.get('title'),
        keyword: formData.get('keyword') || null,
        contentType: formData.get('contentType') || 'blog',
        outline: formData.get('outline') || null,
        publishDate: formData.get('publishDate') || null,
      }),
    })
    if (res.ok) { setShowNew(false); fetchPlans() }
  }

  async function generateContent(planId: string) {
    setGenerating(planId)
    try {
      await fetch('/api/seo/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentPlanId: planId }),
      })
      fetchPlans()
    } finally { setGenerating(null) }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/seo/content/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setPlans((prev) => prev.map((p) => p.id === id ? { ...p, status } : p))
  }

  async function deletePlan(id: string) {
    await fetch(`/api/seo/content/${id}`, { method: 'DELETE' })
    setPlans((prev) => prev.filter((p) => p.id !== id))
  }

  async function fetchSuggestions() {
    setLoadingSuggestions(true)
    setSuggestions([])
    setShowSuggestions(true)
    try {
      const res = await fetch('/api/seo/content/suggest', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      }
    } catch { /* ignore */ } finally { setLoadingSuggestions(false) }
  }

  async function adoptSuggestion(s: ContentSuggestion) {
    const res = await fetch('/api/seo/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: s.title,
        keyword: s.keyword,
        contentType: s.contentType === 'landing' ? 'landing' : 'blog',
        status: 'idea',
      }),
    })
    if (res.ok) {
      fetchPlans()
      setSuggestions((prev) => prev.filter((x) => x.title !== s.title))
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content-Strategie</h1>
          <p className="text-muted-foreground mt-1">{plans.length} Content-Pläne</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSuggestions} disabled={loadingSuggestions}>
            {loadingSuggestions ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lightbulb className="w-4 h-4 mr-2" />}
            KI-Vorschläge
          </Button>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4 mr-2" />Neuer Content-Plan
          </Button>
        </div>

        {/* KI-Vorschläge Dialog */}
        <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>KI-Themenvorschläge</DialogTitle>
            </DialogHeader>
            {loadingSuggestions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Generiere Vorschläge...</span>
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-muted-foreground py-4">Keine Vorschläge verfügbar.</p>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {suggestions.map((s, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{s.title}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{s.keyword}</Badge>
                          <Badge variant="secondary">{s.contentType === 'landing' ? 'Landing Page' : 'Blog'}</Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => adoptSuggestion(s)}>
                        <Plus className="w-4 h-4 mr-1" />Übernehmen
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{s.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Content-Plan erstellen</DialogTitle>
            </DialogHeader>
            <form action={createPlan} className="space-y-4">
              <div>
                <Label htmlFor="title">Titel *</Label>
                <Input id="title" name="title" required placeholder="z.B. 10 Tipps für besseres SEO" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="keyword">Keyword</Label>
                  <Input id="keyword" name="keyword" placeholder="seo tipps" />
                </div>
                <div>
                  <Label htmlFor="contentType">Typ</Label>
                  <select name="contentType" id="contentType" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    <option value="blog">Blog-Artikel</option>
                    <option value="landing">Landing Page</option>
                    <option value="product">Produkttext</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="outline">Gliederung (optional)</Label>
                <Textarea id="outline" name="outline" rows={3} placeholder="- Einleitung&#10;- Punkt 1&#10;- Punkt 2&#10;- Fazit" />
              </div>
              <div>
                <Label htmlFor="publishDate">Geplantes Datum</Label>
                <Input id="publishDate" name="publishDate" type="date" />
              </div>
              <Button type="submit" className="w-full">Plan erstellen</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status-Filter Leiste */}
      <div className="flex gap-2">
        {Object.entries(statusLabels).map(([key, { label }]) => {
          const count = plans.filter((p) => p.status === key).length
          return (
            <Badge key={key} variant="outline" className="text-xs">
              {label}: {count}
            </Badge>
          )
        })}
      </div>

      <InfoBox title="KI-Content-Generator" variant="ai" storageKey="content-tip">
        <p>Erstelle einen Content-Plan mit Titel und Keyword. Klicke dann <strong>KI-Entwurf</strong> (Sparkles) - die KI generiert einen vollstaendigen Artikelentwurf mit SEO-Optimierung. Phasen: Idee → Geplant → In Arbeit → Veroeffentlicht.</p>
      </InfoBox>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PenLine className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Noch keine Content-Pläne. Erstelle deinen ersten Plan.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const st = statusLabels[plan.status] || statusLabels.idea
            return (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{plan.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={st.color}>{st.label}</Badge>
                        {plan.keyword && <Badge variant="outline">{plan.keyword}</Badge>}
                        <span className="text-xs text-muted-foreground">{plan.contentType}</span>
                        {plan.publishDate && (
                          <span className="text-xs text-muted-foreground">
                            · Geplant: {new Date(plan.publishDate).toLocaleDateString('de-DE')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateContent(plan.id)}
                        disabled={generating === plan.id}
                      >
                        {generating === plan.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <><Sparkles className="w-4 h-4 mr-1" />KI-Entwurf</>
                        )}
                      </Button>
                      {plan.aiDraft && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreview(preview === plan.id ? null : plan.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <select
                        value={plan.status}
                        onChange={(e) => updateStatus(plan.id, e.target.value)}
                        className="rounded-md border bg-background px-2 py-1 text-xs"
                      >
                        <option value="idea">Idee</option>
                        <option value="planned">Geplant</option>
                        <option value="writing">In Arbeit</option>
                        <option value="published">Veröffentlicht</option>
                      </select>
                      <Button variant="ghost" size="icon" onClick={() => deletePlan(plan.id)}>
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {plan.outline && !preview && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{plan.outline}</p>
                  </CardContent>
                )}
                {preview === plan.id && plan.aiDraft && (
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap border-t pt-4">
                      {plan.aiDraft}
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
