'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Loader2, TrendingUp, TrendingDown, Minus, Trash2, Search } from 'lucide-react'
import { InfoBox } from '../../components/info-box'
import { cn } from '@/lib/utils'
import { ResponsiveContainer, LineChart, Line } from 'recharts'
import { useToast } from '../../components/toast'
import { ConfirmDialog } from '../../components/confirm-dialog'

interface Keyword {
  id: string
  keyword: string
  domain: string
  currentRank: number | null
  bestRank: number | null
  searchVolume: number | null
  difficulty: number | null
  url: string | null
  history: { date: string; rank: number | null }[]
}

export default function KeywordsPage() {
  const { toast } = useToast()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchKeywords() }, [])

  async function fetchKeywords() {
    try {
      const res = await fetch('/api/seo/keywords')
      if (res.ok) setKeywords(await res.json())
    } catch {
      toast('Keywords konnten nicht geladen werden.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function createKeyword(formData: FormData) {
    try {
      const res = await fetch('/api/seo/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: formData.get('keyword'),
          domain: formData.get('domain'),
          searchVolume: formData.get('searchVolume') ? Number(formData.get('searchVolume')) : null,
          difficulty: formData.get('difficulty') ? Number(formData.get('difficulty')) : null,
        }),
      })
      if (res.ok) {
        setShowNew(false)
        fetchKeywords()
        toast('Keyword hinzugefügt!', 'success')
      } else {
        toast('Keyword konnte nicht erstellt werden.', 'error')
      }
    } catch {
      toast('Verbindungsfehler.', 'error')
    }
  }

  async function deleteKeyword(id: string) {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/seo/keywords/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setKeywords((prev) => prev.filter((k) => k.id !== id))
      } else {
        toast('Keyword konnte nicht gelöscht werden.', 'error')
      }
    } catch {
      toast('Verbindungsfehler.', 'error')
    } finally {
      setDeleteLoading(false)
      setDeleteConfirm(null)
    }
  }

  function getRankChange(kw: Keyword): number | null {
    if (!kw.history || kw.history.length < 2) return null
    const prev = kw.history[1]?.rank
    const curr = kw.currentRank
    if (prev == null || curr == null) return null
    return prev - curr // positiv = Verbesserung
  }

  const filtered = keywords.filter((k) =>
    k.keyword.toLowerCase().includes(search.toLowerCase()) ||
    k.domain.toLowerCase().includes(search.toLowerCase())
  )

  const top10 = keywords.filter((k) => k.currentRank && k.currentRank <= 10).length
  const top20 = keywords.filter((k) => k.currentRank && k.currentRank <= 20).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Keywords</h1>
          <p className="text-muted-foreground mt-1">
            {keywords.length} Keywords getrackt
            {top10 > 0 && <> · <span className="text-green-500">{top10} in Top 10</span></>}
            {top20 > top10 && <> · {top20} in Top 20</>}
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-2" />Keyword hinzufügen
        </Button>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Keyword tracken</DialogTitle>
            </DialogHeader>
            <form action={createKeyword} className="space-y-4">
              <div>
                <Label htmlFor="keyword">Keyword *</Label>
                <Input id="keyword" name="keyword" required placeholder="z.B. marketing automation" />
              </div>
              <div>
                <Label htmlFor="domain">Domain *</Label>
                <Input id="domain" name="domain" required placeholder="z.B. example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="searchVolume">Suchvolumen</Label>
                  <Input id="searchVolume" name="searchVolume" type="number" placeholder="z.B. 1000" />
                </div>
                <div>
                  <Label htmlFor="difficulty">Schwierigkeit (0-100)</Label>
                  <Input id="difficulty" name="difficulty" type="number" min="0" max="100" />
                </div>
              </div>
              <Button type="submit" className="w-full">Keyword tracken</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <InfoBox title="Keyword-Tracking" storageKey="keywords-tip">
        <p>Trage Keywords mit Domain ein, die du tracken willst. Bei verbundener Google Search Console werden Rankings automatisch aktualisiert. Gruene/rote Pfeile zeigen Ranking-Veraenderungen.</p>
      </InfoBox>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Keywords durchsuchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Keyword</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Domain</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Position</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Änderung</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Suchvolumen</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Schwierigkeit</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Verlauf</th>
                  <th className="text-right p-4 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      {keywords.length === 0 ? 'Noch keine Keywords. Füge dein erstes Keyword hinzu.' : 'Keine Ergebnisse.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((kw) => {
                    const change = getRankChange(kw)
                    return (
                      <tr key={kw.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="p-4 font-medium">{kw.keyword}</td>
                        <td className="p-4 text-muted-foreground">{kw.domain}</td>
                        <td className="p-4 text-right">
                          {kw.currentRank ? (
                            <Badge
                              className={cn(
                                kw.currentRank <= 3 ? 'bg-green-500/10 text-green-500' :
                                kw.currentRank <= 10 ? 'bg-blue-500/10 text-blue-500' :
                                kw.currentRank <= 20 ? 'bg-yellow-500/10 text-yellow-500' :
                                'bg-red-500/10 text-red-500'
                              )}
                            >
                              #{kw.currentRank}
                            </Badge>
                          ) : '—'}
                        </td>
                        <td className="p-4 text-right">
                          {change !== null ? (
                            <span className={cn(
                              'flex items-center justify-end gap-1 text-xs font-medium',
                              change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-muted-foreground'
                            )}>
                              {change > 0 ? <TrendingUp className="w-3 h-3" /> :
                               change < 0 ? <TrendingDown className="w-3 h-3" /> :
                               <Minus className="w-3 h-3" />}
                              {change > 0 ? '+' : ''}{change}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="p-4 text-right text-muted-foreground">
                          {kw.searchVolume?.toLocaleString('de-DE') || '—'}
                        </td>
                        <td className="p-4 text-right">
                          {kw.difficulty !== null ? (
                            <Badge variant="outline">{kw.difficulty}/100</Badge>
                          ) : '—'}
                        </td>
                        <td className="p-4">
                          {kw.history && kw.history.length > 2 ? (
                            <div className="w-20 h-8 mx-auto">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={kw.history.slice(0, 14).reverse().map(h => ({ rank: h.rank ? -h.rank : null }))}>
                                  <Line type="monotone" dataKey="rank" stroke={change && change > 0 ? '#22c55e' : change && change < 0 ? '#ef4444' : '#6b7280'} strokeWidth={1.5} dot={false} connectNulls />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground block text-center">—</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(kw.id)} aria-label="Keyword löschen">
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteConfirm}
        loading={deleteLoading}
        title="Keyword löschen?"
        onConfirm={() => deleteConfirm && deleteKeyword(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
