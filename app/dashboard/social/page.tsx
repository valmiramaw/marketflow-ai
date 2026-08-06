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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2, Trash2, Pencil, Sparkles, Calendar, Share2 } from 'lucide-react'

interface SocialPost {
  id: string
  platform: string
  content: string
  hashtags: string | null
  mediaUrl: string | null
  scheduledAt: string | null
  publishedAt: string | null
  status: string
  productContentId: string | null
  productContent: { id: string; title: string } | null
  createdAt: string
}

interface ProductContent {
  id: string
  title: string
  productName: string | null
}

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', color: 'bg-pink-500/10 text-pink-500' },
  { value: 'tiktok', label: 'TikTok', color: 'bg-cyan-500/10 text-cyan-500' },
  { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-600/10 text-blue-600' },
  { value: 'facebook', label: 'Facebook', color: 'bg-blue-500/10 text-blue-500' },
  { value: 'twitter', label: 'Twitter/X', color: 'bg-gray-500/10 text-gray-300' },
]

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Entwurf', color: 'bg-gray-500/10 text-gray-500' },
  scheduled: { label: 'Geplant', color: 'bg-yellow-500/10 text-yellow-500' },
  published: { label: 'Veröffentlicht', color: 'bg-green-500/10 text-green-500' },
}

export default function SocialPage() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [contents, setContents] = useState<ProductContent[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [form, setForm] = useState({ platform: 'instagram', content: '', hashtags: '', scheduledAt: '' })
  const [genForm, setGenForm] = useState({ platform: 'instagram', productContentId: '', topic: '' })

  useEffect(() => {
    fetchPosts()
    fetchContents()
  }, [])

  async function fetchPosts() {
    try {
      const res = await fetch('/api/social')
      const data = await res.json()
      setPosts(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function fetchContents() {
    try {
      const res = await fetch('/api/content-studio')
      const data = await res.json()
      setContents(data)
    } catch {
      // ignore
    }
  }

  async function handleSubmit() {
    try {
      await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setDialogOpen(false)
      setForm({ platform: 'instagram', content: '', hashtags: '', scheduledAt: '' })
      fetchPosts()
    } catch {
      // ignore
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(genForm),
      })
      if (res.ok) {
        const data = await res.json()
        // Post direkt erstellen
        await fetch('/api/social', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: genForm.platform,
            content: data.content,
            hashtags: data.hashtags,
            productContentId: genForm.productContentId || null,
          }),
        })
        setGenerateOpen(false)
        setGenForm({ platform: 'instagram', productContentId: '', topic: '' })
        fetchPosts()
      }
    } catch {
      // ignore
    } finally {
      setGenerating(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/social/${id}`, { method: 'DELETE' })
      fetchPosts()
    } catch {
      // ignore
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await fetch(`/api/social/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(status === 'published' ? { publishedAt: new Date().toISOString() } : {}) }),
      })
      fetchPosts()
    } catch {
      // ignore
    }
  }

  const filtered = activeTab === 'all' ? posts : posts.filter((p) => p.platform === activeTab)

  // Kalender: aktuelle + nächste Woche
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Montag
  const calendarDays: Date[] = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    calendarDays.push(d)
  }

  function getPostsForDay(day: Date) {
    return posts.filter((p) => {
      const date = p.scheduledAt ? new Date(p.scheduledAt) : new Date(p.createdAt)
      return date.toDateString() === day.toDateString()
    })
  }

  const platformColor = (platform: string) =>
    PLATFORMS.find((p) => p.value === platform)?.color || 'bg-gray-500/10 text-gray-500'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Media</h1>
          <p className="text-muted-foreground">Posts planen, erstellen und verwalten</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setGenerateOpen(true)}>
            <Sparkles className="w-4 h-4 mr-2" />
            Aus Content generieren
          </Button>
          <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>KI-Post generieren</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Plattform</Label>
                  <Select value={genForm.platform} onValueChange={(v) => v && setGenForm({ ...genForm, platform: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bestehender Content (optional)</Label>
                  <Select value={genForm.productContentId || undefined} onValueChange={(v) => v && setGenForm({ ...genForm, productContentId: v })}>
                    <SelectTrigger><SelectValue placeholder="Content auswählen..." /></SelectTrigger>
                    <SelectContent>
                      {contents.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Oder freies Thema</Label>
                  <Textarea
                    value={genForm.topic}
                    onChange={(e) => setGenForm({ ...genForm, topic: e.target.value })}
                    placeholder="z.B. Sommeraktion, neues Produkt..."
                    rows={2}
                  />
                </div>
                <Button onClick={handleGenerate} disabled={generating || (!genForm.productContentId && !genForm.topic)} className="w-full">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Post generieren
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Neuer Post
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuer Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Plattform</Label>
                  <Select value={form.platform} onValueChange={(v) => v && setForm({ ...form, platform: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Inhalt *</Label>
                  <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Post-Text..." rows={4} />
                </div>
                <div>
                  <Label>Hashtags</Label>
                  <Input value={form.hashtags} onChange={(e) => setForm({ ...form, hashtags: e.target.value })} placeholder="#matcha #gesund #tee" />
                </div>
                <div>
                  <Label>Geplant für</Label>
                  <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
                </div>
                <Button onClick={handleSubmit} disabled={!form.content} className="w-full">
                  Erstellen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kalender-Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Posting-Kalender (2 Wochen)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
            {calendarDays.map((day) => {
              const dayPosts = getPostsForDay(day)
              const isToday = day.toDateString() === today.toDateString()
              return (
                <div
                  key={day.toISOString()}
                  className={`p-2 rounded-md text-center min-h-[60px] ${
                    isToday ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'
                  }`}
                >
                  <div className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                    {day.getDate()}
                  </div>
                  <div className="flex flex-wrap gap-1 justify-center mt-1">
                    {dayPosts.map((p) => (
                      <div
                        key={p.id}
                        className={`w-2 h-2 rounded-full ${
                          p.platform === 'instagram' ? 'bg-pink-500' :
                          p.platform === 'tiktok' ? 'bg-cyan-500' :
                          p.platform === 'linkedin' ? 'bg-blue-600' :
                          p.platform === 'facebook' ? 'bg-blue-500' : 'bg-gray-400'
                        }`}
                        title={`${p.platform}: ${p.content.slice(0, 50)}`}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={activeTab === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('all')}>
          Alle ({posts.length})
        </Button>
        {PLATFORMS.map((p) => {
          const count = posts.filter((post) => post.platform === p.value).length
          return (
            <Button key={p.value} variant={activeTab === p.value ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab(p.value)}>
              {p.label} ({count})
            </Button>
          )
        })}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Share2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Posts</h3>
            <p className="text-muted-foreground">Erstelle deinen ersten Social-Media-Post.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={platformColor(post.platform)}>
                        {PLATFORMS.find((p) => p.value === post.platform)?.label}
                      </Badge>
                      <Badge className={STATUS_LABELS[post.status]?.color || ''}>
                        {STATUS_LABELS[post.status]?.label || post.status}
                      </Badge>
                      {post.productContent && (
                        <Badge variant="outline" className="text-xs">
                          {post.productContent.title}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap line-clamp-3">{post.content}</p>
                    {post.hashtags && (
                      <p className="text-xs text-muted-foreground mt-1">{post.hashtags}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {post.scheduledAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.scheduledAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <span>Erstellt: {new Date(post.createdAt).toLocaleDateString('de-DE')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {post.status === 'draft' && (
                      <Button variant="ghost" size="sm" onClick={() => handleStatusChange(post.id, 'published')}>
                        <Pencil className="w-4 h-4 mr-1" />
                        Veröffentlichen
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
