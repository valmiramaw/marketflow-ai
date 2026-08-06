'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Loader2, Search, Trash2, Pencil, Sparkles, ExternalLink, ChevronDown, ChevronUp, Info } from 'lucide-react'

interface Competitor {
  id: string
  name: string
  website: string | null
  description: string | null
  industry: string | null
  notes: string | null
  aiAnalysis: string | null
  lastAnalyzedAt: string | null
  createdAt: string
}

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showInfo, setShowInfo] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('competitors-info-dismissed') !== 'true'
    }
    return true
  })
  const [form, setForm] = useState({ name: '', website: '', industry: '', notes: '' })

  useEffect(() => {
    fetchCompetitors()
  }, [])

  async function fetchCompetitors() {
    try {
      const res = await fetch('/api/competitors')
      const data = await res.json()
      setCompetitors(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    try {
      if (editingId) {
        await fetch(`/api/competitors/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        await fetch('/api/competitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      setDialogOpen(false)
      setEditingId(null)
      setForm({ name: '', website: '', industry: '', notes: '' })
      fetchCompetitors()
    } catch {
      // ignore
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/competitors/${id}`, { method: 'DELETE' })
      fetchCompetitors()
    } catch {
      // ignore
    }
  }

  async function handleAnalyze(id: string) {
    setAnalyzingId(id)
    try {
      const res = await fetch(`/api/competitors/${id}/analyze`, { method: 'POST' })
      if (res.ok) {
        const updated = await res.json()
        setCompetitors((prev) => prev.map((c) => (c.id === id ? updated : c)))
        setExpandedId(id)
      }
    } catch {
      // ignore
    } finally {
      setAnalyzingId(null)
    }
  }

  function openEdit(c: Competitor) {
    setForm({ name: c.name, website: c.website || '', industry: c.industry || '', notes: c.notes || '' })
    setEditingId(c.id)
    setDialogOpen(true)
  }

  function openCreate() {
    setForm({ name: '', website: '', industry: '', notes: '' })
    setEditingId(null)
    setDialogOpen(true)
  }

  const filtered = competitors.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wettbewerber</h1>
          <p className="text-muted-foreground">Wettbewerbslandschaft analysieren und Differenzierungspotenziale finden</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Wettbewerber hinzufügen
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Wettbewerber bearbeiten' : 'Neuer Wettbewerber'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="z.B. Matchaful" />
              </div>
              <div>
                <Label>Website</Label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label>Branche</Label>
                <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="z.B. Matcha / Tee / Getränke" />
              </div>
              <div>
                <Label>Notizen</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Wichtige Beobachtungen..." rows={3} />
              </div>
              <Button onClick={handleSubmit} disabled={!form.name} className="w-full">
                {editingId ? 'Speichern' : 'Hinzufügen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {showInfo && (
        <div className="relative rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <button
            onClick={() => { setShowInfo(false); localStorage.setItem('competitors-info-dismissed', 'true') }}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          >
            &times;
          </button>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Tracke deine Wettbewerber und lass die KI Differenzierungspotenziale identifizieren. Die Analyse berücksichtigt dein Markenprofil für passgenaue Empfehlungen.
            </p>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Wettbewerber suchen..."
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Wettbewerber</h3>
            <p className="text-muted-foreground mb-4">Füge deinen ersten Wettbewerber hinzu, um die KI-Analyse zu starten.</p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Wettbewerber hinzufügen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{c.name}</CardTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {c.website && (
                        <a href={c.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
                          <ExternalLink className="w-3 h-3" />
                          {c.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      )}
                      {c.industry && <Badge variant="secondary">{c.industry}</Badge>}
                      {c.lastAnalyzedAt && (
                        <span>Analyse: {new Date(c.lastAnalyzedAt).toLocaleDateString('de-DE')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAnalyze(c.id)}
                      disabled={analyzingId === c.id}
                    >
                      {analyzingId === c.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-1" />
                      )}
                      KI-Analyse
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {c.aiAnalysis && (
                <CardContent className="pt-0">
                  <button
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {expandedId === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {expandedId === c.id ? 'Analyse ausblenden' : 'Analyse anzeigen'}
                  </button>
                  {expandedId === c.id && (
                    <div className="mt-3 p-4 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                      {c.aiAnalysis}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
