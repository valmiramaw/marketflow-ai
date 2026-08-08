'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Moon, Sun, Menu, X, ChevronRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Sidebar } from './sidebar'

const segmentLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  ads: 'Performance Ads',
  campaigns: 'Kampagnen',
  budgets: 'Budgets',
  'ab-tests': 'A/B Tests',
  creatives: 'Werbemittel',
  seo: 'SEO & Analytics',
  keywords: 'Keywords',
  content: 'Content',
  audit: 'SEO-Audit',
  analytics: 'Analytics',
  brand: 'Marke & Branding',
  'content-studio': 'Content-Studio',
  competitors: 'Wettbewerber',
  social: 'Social Media',
  email: 'E-Mail',
  sales: 'Sales',
  leads: 'Leads',
  pipeline: 'Pipeline',
  proposals: 'Proposals',
  forecasting: 'Forecasting',
  automations: 'Automatisierungen',
  'ai-chat': 'KI-Chat',
  'ai-usage': 'KI-Nutzung',
  reports: 'Berichte',
  calendar: 'Kalender',
  settings: 'Einstellungen',
}

export function TopBar() {
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Schließe Drawer bei Routenwechsel
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Body-Scroll sperren wenn Drawer offen
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-sm px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile: Seitentitel */}
        {(() => {
          const segments = pathname.split('/').filter(Boolean)
          const lastSeg = segments[segments.length - 1]
          const title = segmentLabels[lastSeg] || lastSeg
          return segments.length > 0 ? (
            <span className="sm:hidden text-sm font-medium truncate flex-1">{title}</span>
          ) : null
        })()}

        {/* Desktop: Breadcrumbs */}
        <nav className="flex-1 hidden sm:flex items-center gap-1 text-sm text-muted-foreground overflow-hidden">
          {(() => {
            const segments = pathname.split('/').filter(Boolean)
            if (segments.length <= 1) return null
            return segments.map((seg, i) => {
              const href = '/' + segments.slice(0, i + 1).join('/')
              const label = segmentLabels[seg] || seg
              const isLast = i === segments.length - 1
              return (
                <span key={href} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50" />}
                  {isLast ? (
                    <span className="font-medium text-foreground truncate">{label}</span>
                  ) : (
                    <Link href={href} className="hover:text-foreground transition-colors truncate">{label}</Link>
                  )}
                </span>
              )
            })
          })()}
        </nav>

        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="hidden md:inline-flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Suchen...</span>
          <kbd className="ml-2 inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 text-[10px] font-medium">
            Ctrl K
          </kbd>
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Theme wechseln</span>
        </Button>
      </header>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 animate-in slide-in-from-left duration-200">
            <div className="absolute top-3 right-3 z-10">
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Sidebar mobile onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
