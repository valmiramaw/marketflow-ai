'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Loader2, Sparkles, Eye, EyeOff, Trash2, PenTool } from 'lucide-react'
import { useToast } from '../components/toast'
import { ConfirmDialog } from '../components/confirm-dialog'

interface ProductContent {
  id: string
  title: string
  productName: string | null
  contentType: string
  language: string
  keyword: string | null
  prompt: string | null
  generatedContent: string | null
  status: string
  createdAt: string
}

const contentTypeLabels: Record<string, string> = {
  product_description: 'Produkttext',
  blog_article: 'Blog-Artikel',
  recipe: 'Rezept',
  landing_page: 'Landing Page',
  social_post: 'Social Post',
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Entwurf', color: 'bg-gray-500/10 text-gray-500' },
  reviewed: { label: 'Geprüft', color: 'bg-blue-500/10 text-blue-500' },
  final: { label: 'Final', color: 'bg-green-500/10 text-green-500' },
}

const tabFilters = [
  { value: 'all', label: 'Alle' },
  { value: 'product_description', label: 'Produkttexte' },
  { value: 'blog_article', label: 'Blog' },
  { value: 'recipe', label: 'Rezepte' },
  { value: 'landing_page', label: 'Landing Pages' },
  { value: 'social_post', label: 'Social' },
]

export default function ContentStudioPage() {
  const [contents, setContents] = useState<ProductContent[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  const { toast } = useToast()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => { fetchContents() }, [])

  async function fetchContents() {
    try {
      const res = await fetch('/api/content-studio')
      if (res.ok) setContents(await res.json())
    } catch {
      toast('Inhalte konnten nicht geladen werden.', 'error')
    } finally { setLoading(false) }
  }

  async function createContent(formData: FormData) {
    try {
      const res = await fetch('/api/content-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          productName: formData.get('productName') || null,
          contentType: formData.get('contentType') || 'blog_article',
          language: formData.get('language') || 'de',
          keyword: formData.get('keyword') || null,
          prompt: formData.get('prompt') || null,
        }),
      })
      if (res.ok) {
        setShowNew(false)
        fetchContents()
        toast('Content erstellt!', 'success')
      } else {
        toast('Content konnte nicht erstellt werden.', 'error')
      }
    } catch {
      toast('Verbindungsfehler.', 'error')
    }
  }

  async function generateContent(contentId: string) {
    setGenerating(contentId)
    try {
      const res = await fetch('/api/content-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId }),
      })
      if (res.ok) {
        fetchContents()
        toast('Inhalt generiert!', 'success')
      } else {
        toast('Inhalt konnte nicht generiert werden.', 'error')
      }
    } catch {
      toast('Verbindungsfehler.', 'error')
    } finally { setGenerating(null) }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/content-studio/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) setContents((prev) => prev.map((c) => c.id === id ? { ...c, status } : c))
      else toast('Status konnte nicht geändert werden.', 'error')
    } catch {
      toast('Verbindungsfehler.', 'error')
    }
  }

  async function deleteContent(id: string) {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/content-studio/${id}`, { method: 'DELETE' })
      if (res.ok) setContents((prev) => prev.filter((c) => c.id !== id))
      else toast('Content konnte nicht gelöscht werden.', 'error')
    } catch {
      toast('Verbindungsfehler.', 'error')
    } finally {
      setDeleteLoading(false)
      setDeleteConfirm(null)
    }
  }

  const filtered = activeTab === 'all' ? contents : contents.filter((c) => c.contentType === activeTab)

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content-Studio</h1>
          <p className="text-muted-foreground mt-1">{contents.length} Inhalte</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-2" />Neuer Content
        </Button>
      </div>

      {/* Neuer Content Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Content erstellen</DialogTitle>
          </DialogHeader>
          <form action={createContent} className="space-y-4">
            <div>
              <Label htmlFor="contentType">Content-Typ *</Label>
              <select name="contentType" id="contentType" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="product_description">Produkttext</option>
                <option value="blog_article">Blog-Artikel</option>
                <option value="recipe">Rezept</option>
                <option value="landing_page">Landing Page</option>
                <option value="social_post">Social Post</option>
              </select>
            </div>
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input id="title" name="title" required placeholder="z.B. Matcha Latte Supreme - Produktbeschreibung" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productName">Produkt / Thema</Label>
                <Input id="productName" name="productName" placeholder="z.B. Matcha Latte Supreme" />
              </div>
              <div>
                <Label htmlFor="keyword">Keyword</Label>
                <Input id="keyword" name="keyword" placeholder="z.B. matcha latte kaufen" />
              </div>
            </div>
            <div>
              <Label htmlFor="language">Sprache</Label>
              <select name="language" id="language" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="de">Deutsch</option>
                <option value="en">Englisch</option>
              </select>
            </div>
            <div>
              <Label htmlFor="prompt">Zusätzliche Anweisungen</Label>
              <Textarea id="prompt" name="prompt" rows={3} placeholder="Besondere Anforderungen an den Text..." />
            </div>
            <Button type="submit" className="w-full">Content erstellen</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tabFilters.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              {tab.value !== 'all' && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({contents.filter((c) => c.contentType === tab.value).length})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Content-Liste */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PenTool className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {activeTab === 'all' ? 'Noch keine Inhalte. Erstelle deinen ersten Content.' : `Keine ${contentTypeLabels[activeTab] || 'Inhalte'} vorhanden.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((content) => {
            const st = statusLabels[content.status] || statusLabels.draft
            return (
              <Card key={content.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{content.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={st.color}>{st.label}</Badge>
                        <Badge variant="outline">{contentTypeLabels[content.contentType] || content.contentType}</Badge>
                        <Badge variant="outline" className="text-xs">{content.language.toUpperCase()}</Badge>
                        {content.keyword && <Badge variant="secondary">{content.keyword}</Badge>}
                        {content.productName && (
                          <span className="text-xs text-muted-foreground">
                            · {content.productName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateContent(content.id)}
                        disabled={generating === content.id}
                      >
                        {generating === content.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <><Sparkles className="w-4 h-4 mr-1" />KI generieren</>
                        )}
                      </Button>
                      {content.generatedContent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewing(previewing === content.id ? null : content.id)}
                          aria-label={previewing === content.id ? 'Vorschau ausblenden' : 'Vorschau anzeigen'}
                        >
                          {previewing === content.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      )}
                      <select
                        value={content.status}
                        onChange={(e) => updateStatus(content.id, e.target.value)}
                        className="rounded-md border bg-background px-2 py-1 text-xs"
                      >
                        <option value="draft">Entwurf</option>
                        <option value="reviewed">Geprüft</option>
                        <option value="final">Final</option>
                      </select>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(content.id)} aria-label="Content löschen">
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {previewing === content.id && content.generatedContent && (
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap border-t pt-4">
                      {content.generatedContent}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        loading={deleteLoading}
        title="Content löschen?"
        onConfirm={() => deleteConfirm && deleteContent(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
