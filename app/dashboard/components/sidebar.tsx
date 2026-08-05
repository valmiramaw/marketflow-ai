'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Megaphone,
  Search,
  Users,
  MessageSquare,
  Settings,
  TrendingUp,
  Target,
  FileText,
  BarChart3,
  Globe,
  PenTool,
  ClipboardCheck,
  LineChart,
  Kanban,
  FileSignature,
  ChevronDown,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

interface NavSection {
  label: string
  icon: React.ElementType
  href: string
  color: string
  children?: { label: string; href: string; icon: React.ElementType }[]
}

const navigation: NavSection[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    color: 'text-blue-500',
  },
  {
    label: 'Performance Ads',
    icon: Megaphone,
    href: '/dashboard/ads',
    color: 'text-orange-500',
    children: [
      { label: 'Kampagnen', href: '/dashboard/ads/campaigns', icon: Target },
      { label: 'Budgets', href: '/dashboard/ads/budgets', icon: TrendingUp },
      { label: 'A/B Tests', href: '/dashboard/ads/ab-tests', icon: BarChart3 },
      { label: 'Werbemittel', href: '/dashboard/ads/creatives', icon: FileText },
    ],
  },
  {
    label: 'SEO & Analytics',
    icon: Search,
    href: '/dashboard/seo',
    color: 'text-green-500',
    children: [
      { label: 'Keywords', href: '/dashboard/seo/keywords', icon: Globe },
      { label: 'Content', href: '/dashboard/seo/content', icon: PenTool },
      { label: 'SEO-Audit', href: '/dashboard/seo/audit', icon: ClipboardCheck },
      { label: 'Analytics', href: '/dashboard/seo/analytics', icon: LineChart },
    ],
  },
  {
    label: 'Sales',
    icon: Users,
    href: '/dashboard/sales',
    color: 'text-purple-500',
    children: [
      { label: 'Leads', href: '/dashboard/sales/leads', icon: Users },
      { label: 'Pipeline', href: '/dashboard/sales/pipeline', icon: Kanban },
      { label: 'Proposals', href: '/dashboard/sales/proposals', icon: FileSignature },
      { label: 'Forecasting', href: '/dashboard/sales/forecasting', icon: TrendingUp },
    ],
  },
  {
    label: 'KI-Assistent',
    icon: MessageSquare,
    href: '/dashboard/ai-chat',
    color: 'text-cyan-500',
  },
  {
    label: 'Einstellungen',
    icon: Settings,
    href: '/dashboard/settings',
    color: 'text-gray-500',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string[]>([])

  function toggleSection(label: string) {
    setExpanded((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r border-border bg-card h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold">MarketFlow</span>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">AI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const active = isActive(item.href)
          const isExpanded = expanded.includes(item.label) || (item.children && pathname.startsWith(item.href))

          return (
            <div key={item.href}>
              <div className="flex items-center">
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className={cn('w-5 h-5', active ? item.color : '')} />
                  {item.label}
                </Link>
                {item.children && (
                  <button
                    onClick={() => toggleSection(item.label)}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                  >
                    <ChevronDown
                      className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')}
                    />
                  </button>
                )}
              </div>

              {item.children && isExpanded && (
                <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
                  {item.children.map((child) => {
                    const childActive = pathname === child.href
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                          childActive
                            ? 'text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <child.icon className="w-4 h-4" />
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          Multi-KI aktiv
        </div>
      </div>
    </aside>
  )
}
