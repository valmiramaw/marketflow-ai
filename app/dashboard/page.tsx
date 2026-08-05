'use client'

import { KpiCard } from './components/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Megaphone,
  Search,
  Users,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointerClick,
  UserPlus,
} from 'lucide-react'

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Alle KPIs auf einen Blick
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Ad Spend (Monat)"
          value="€12.450"
          change={-3.2}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <KpiCard
          title="Impressionen"
          value="284.500"
          change={12.5}
          icon={<Eye className="w-5 h-5" />}
        />
        <KpiCard
          title="Organischer Traffic"
          value="18.320"
          change={8.1}
          icon={<MousePointerClick className="w-5 h-5" />}
        />
        <KpiCard
          title="Neue Leads"
          value="47"
          change={15.3}
          icon={<UserPlus className="w-5 h-5" />}
        />
      </div>

      {/* Module Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ads Module */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Megaphone className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Performance Ads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Aktive Kampagnen</span>
              <Badge variant="secondary">12</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg. ROAS</span>
              <span className="font-medium text-green-500">3.2x</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg. CTR</span>
              <span className="font-medium">2.8%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">KI-Empfehlungen</span>
              <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">5 offen</Badge>
            </div>
          </CardContent>
        </Card>

        {/* SEO Module */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Search className="w-5 h-5 text-green-500" />
            <CardTitle className="text-lg">SEO & Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Getrackte Keywords</span>
              <Badge variant="secondary">156</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Top 10 Rankings</span>
              <span className="font-medium text-green-500">34</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">SEO-Score</span>
              <span className="font-medium">82/100</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Content-Ideen</span>
              <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">8 geplant</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Sales Module */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg">Sales Intelligence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pipeline-Wert</span>
              <span className="font-bold">€148.500</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Offene Leads</span>
              <Badge variant="secondary">23</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="font-medium text-green-500">34%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Follow-ups heute</span>
              <Badge className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20">3 fällig</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-500" />
          <CardTitle>KI-Insights der Woche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-orange-500/10 text-orange-500">Ads</Badge>
                <span className="text-sm font-medium">Budget-Empfehlung</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Kampagne &quot;Brand Awareness Q3&quot; hat einen ROAS von 4.1x.
                Budget-Erhöhung um 20% empfohlen.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-500/10 text-green-500">SEO</Badge>
                <span className="text-sm font-medium">Ranking-Chance</span>
              </div>
              <p className="text-sm text-muted-foreground">
                3 Keywords auf Position 11-15 mit hohem Suchvolumen.
                Content-Optimierung könnte Top-10 bringen.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-500/10 text-purple-500">Sales</Badge>
                <span className="text-sm font-medium">Hot Lead</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Lead &quot;TechCorp GmbH&quot; hat Score 92/100 und 3 Website-Besuche
                diese Woche. Sofortige Kontaktaufnahme empfohlen.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-cyan-500/10 text-cyan-500">Cross</Badge>
                <span className="text-sm font-medium">Synergie</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Top-performing Ad-Keywords überschneiden sich mit SEO-Lücken.
                Organisches Ranking könnte Ad-Kosten um ~€800/Monat senken.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
