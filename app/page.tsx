import Link from 'next/link'
import { Megaphone, Search, Users, Cpu, BarChart3, Sparkles, ArrowRight, Zap, Target, TrendingUp } from 'lucide-react'

const features = [
  {
    icon: Megaphone,
    title: 'Performance Ads',
    description: 'Google, Meta, TikTok & Snapchat Kampagnen verwalten. KI-Budgetoptimierung, A/B-Tests und Creative-Analyse.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Search,
    title: 'SEO & Analytics',
    description: 'Keywords tracken, Content planen, SEO-Audits. GA4-Integration mit automatischer Daten-Synchronisierung.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: Users,
    title: 'Sales Intelligence',
    description: 'Leads verwalten, KI-Scoring, Pipeline-Kanban, Proposals und Umsatz-Forecasting.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Cpu,
    title: 'Multi-KI System',
    description: 'Claude, GPT-4o und Gemini arbeiten zusammen. Automatisches Routing nach Aufgabentyp mit Fallback.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: BarChart3,
    title: 'Wochenberichte',
    description: 'KI-generierte Cross-Modul Reports. Automatisch jeden Montag oder manuell auf Knopfdruck.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: Sparkles,
    title: 'KI-Assistent',
    description: 'Multi-KI Chat für Marketing- & Sales-Fragen. Einzelne KI oder Kollaborationsmodus mit allen Providern.',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
  },
]

const stats = [
  { label: 'KI-Provider', value: '3', icon: Zap },
  { label: 'Module', value: '6+', icon: Target },
  { label: 'Automatisierungen', value: '∞', icon: TrendingUp },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5" />
        <nav className="relative max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">MarketFlow AI</span>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
          >
            Dashboard öffnen
          </Link>
        </nav>

        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Multi-KI Marketing & Sales Suite
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Dein KI-Cockpit für
            <span className="bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent"> Marketing & Sales</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Drei KI-Provider. Sechs Module. Ein Dashboard. MarketFlow AI vereint Performance Ads, SEO, Sales Intelligence und KI-Analyse in einer Plattform.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
            >
              Jetzt starten
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/ai-chat"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition"
            >
              <Sparkles className="w-4 h-4" />
              KI-Chat testen
            </Link>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30">
        <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-3 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold">Alles was du brauchst</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Sechs Module, drei KI-Provider, ein Ziel: Dein Marketing und Sales auf das nächste Level bringen.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border border-border hover:border-border/80 hover:bg-muted/30 transition group"
            >
              <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}>
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Multi-KI Section */}
      <section className="border-t border-border bg-muted/20">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl font-bold mb-4">3 KIs. 1 System.</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-12">
            Jede KI hat ihre Stärke. MarketFlow routet automatisch zum besten Provider.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-orange-500/20 bg-orange-500/5">
              <p className="text-lg font-bold text-orange-500 mb-1">Claude</p>
              <p className="text-sm text-muted-foreground">Strategie, Content, Reports, Chat, Proposals</p>
            </div>
            <div className="p-6 rounded-xl border border-green-500/20 bg-green-500/5">
              <p className="text-lg font-bold text-green-500 mb-1">GPT-4o</p>
              <p className="text-sm text-muted-foreground">Lead-Scoring, Daten-Extraktion, JSON, Keywords</p>
            </div>
            <div className="p-6 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <p className="text-lg font-bold text-blue-500 mb-1">Gemini</p>
              <p className="text-sm text-muted-foreground">Bild-Analyse, Bulk-Verarbeitung, Creative-Reviews</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">Bereit loszulegen?</h2>
        <p className="text-muted-foreground mb-8">
          Öffne das Dashboard und starte mit deinem ersten Lead, Keyword oder Kampagne.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition text-lg"
        >
          Zum Dashboard
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <p>MarketFlow AI</p>
          <p>Multi-KI Marketing & Sales Suite</p>
        </div>
      </footer>
    </div>
  )
}
