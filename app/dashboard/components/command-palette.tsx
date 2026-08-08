'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  LayoutDashboard, Megaphone, Search, Users, MessageSquare, Settings,
  Target, FileText, BarChart3, Globe, PenTool, ClipboardCheck, LineChart,
  Kanban, FileSignature, TrendingUp, Cpu, FileBarChart, Palette, Brush,
  Share2, Mail, Workflow, CalendarDays,
} from 'lucide-react'

interface CommandItem {
  label: string
  href: string
  icon: React.ElementType
  keywords: string[]
}

const commands: CommandItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, keywords: ['home', 'start', 'übersicht'] },
  { label: 'Performance Ads', href: '/dashboard/ads', icon: Megaphone, keywords: ['werbung', 'kampagnen', 'google', 'meta'] },
  { label: 'Kampagnen', href: '/dashboard/ads/campaigns', icon: Target, keywords: ['ads', 'werbung'] },
  { label: 'Budgets', href: '/dashboard/ads/budgets', icon: TrendingUp, keywords: ['geld', 'ausgaben'] },
  { label: 'A/B Tests', href: '/dashboard/ads/ab-tests', icon: BarChart3, keywords: ['split', 'test', 'experiment'] },
  { label: 'Werbemittel', href: '/dashboard/ads/creatives', icon: FileText, keywords: ['creative', 'anzeigen'] },
  { label: 'SEO & Analytics', href: '/dashboard/seo', icon: Search, keywords: ['suchmaschine', 'ranking'] },
  { label: 'Keywords', href: '/dashboard/seo/keywords', icon: Globe, keywords: ['suchbegriffe', 'seo'] },
  { label: 'Content-Planung', href: '/dashboard/seo/content', icon: PenTool, keywords: ['artikel', 'blog', 'texte'] },
  { label: 'SEO-Audit', href: '/dashboard/seo/audit', icon: ClipboardCheck, keywords: ['prüfung', 'analyse'] },
  { label: 'Analytics', href: '/dashboard/seo/analytics', icon: LineChart, keywords: ['statistiken', 'daten'] },
  { label: 'Marke & Branding', href: '/dashboard/brand', icon: Palette, keywords: ['markenkit', 'farben', 'logo'] },
  { label: 'Content-Studio', href: '/dashboard/content-studio', icon: PenTool, keywords: ['erstellen', 'generieren'] },
  { label: 'Wettbewerber', href: '/dashboard/competitors', icon: Search, keywords: ['konkurrenz', 'markt'] },
  { label: 'Social Media', href: '/dashboard/social', icon: Share2, keywords: ['post', 'instagram', 'linkedin', 'tiktok'] },
  { label: 'E-Mail Marketing', href: '/dashboard/email', icon: Mail, keywords: ['newsletter', 'kampagne', 'kontakte'] },
  { label: 'Sales', href: '/dashboard/sales', icon: Users, keywords: ['vertrieb', 'verkauf'] },
  { label: 'Leads', href: '/dashboard/sales/leads', icon: Users, keywords: ['kontakte', 'interessenten'] },
  { label: 'Pipeline', href: '/dashboard/sales/pipeline', icon: Kanban, keywords: ['deals', 'stufen'] },
  { label: 'Proposals', href: '/dashboard/sales/proposals', icon: FileSignature, keywords: ['angebote', 'vorschläge'] },
  { label: 'Forecasting', href: '/dashboard/sales/forecasting', icon: TrendingUp, keywords: ['prognose', 'vorhersage'] },
  { label: 'Automatisierungen', href: '/dashboard/automations', icon: Workflow, keywords: ['automation', 'workflows'] },
  { label: 'KI-Chat', href: '/dashboard/ai-chat', icon: MessageSquare, keywords: ['assistent', 'fragen', 'claude', 'gpt'] },
  { label: 'KI-Nutzung', href: '/dashboard/ai-usage', icon: Cpu, keywords: ['tokens', 'kosten', 'verbrauch'] },
  { label: 'Wochenberichte', href: '/dashboard/reports', icon: FileBarChart, keywords: ['report', 'zusammenfassung'] },
  { label: 'Kalender', href: '/dashboard/calendar', icon: CalendarDays, keywords: ['termine', 'events', 'planung'] },
  { label: 'Einstellungen', href: '/dashboard/settings', icon: Settings, keywords: ['config', 'profil', 'api'] },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const filtered = query.trim()
    ? commands.filter((c) => {
        const q = query.toLowerCase()
        return (
          c.label.toLowerCase().includes(q) ||
          c.keywords.some((k) => k.includes(q))
        )
      })
    : commands

  const navigate = useCallback(
    (href: string) => {
      setOpen(false)
      setQuery('')
      setSelectedIndex(0)
      router.push(href)
    },
    [router]
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      navigate(filtered[selectedIndex].href)
    }
  }

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const item = list.children[selectedIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setQuery(''); setSelectedIndex(0) } }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <div className="flex items-center border-b border-border px-4">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Seite suchen..."
            className="flex-1 px-3 py-3 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div ref={listRef} className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Keine Ergebnisse</p>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors ${
                  i === selectedIndex
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span>Navigieren mit <kbd className="px-1 py-0.5 rounded border border-border bg-muted">↑↓</kbd></span>
          <span>Öffnen mit <kbd className="px-1 py-0.5 rounded border border-border bg-muted">Enter</kbd></span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
