'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { KpiCard } from '../components/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Users, DollarSign, TrendingUp, Target, CheckCircle, Clock } from 'lucide-react'
import { InfoBox } from '../components/info-box'
import { useToast } from '../components/toast'

interface Lead {
  id: string
  company: string
  contactName: string | null
  status: string
  score: number | null
  value: number | null
}

interface FollowUp {
  id: string
  type: string
  subject: string
  dueDate: string
  completed: boolean
  lead: { id: string; company: string; contactName: string | null }
}

export default function SalesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/sales/leads').then((r) => r.ok ? r.json() : []),
      fetch('/api/sales/follow-ups?pending=true').then((r) => r.ok ? r.json() : []),
    ]).then(([l, f]) => {
      setLeads(l)
      setFollowUps(f)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const totalValue = leads.reduce((s, l) => s + (l.value || 0), 0)
  const openLeads = leads.filter((l) => !['won', 'lost'].includes(l.status)).length
  const wonLeads = leads.filter((l) => l.status === 'won').length
  const winRate = leads.length > 0 ? Math.round((wonLeads / leads.length) * 100) : 0
  const avgDeal = wonLeads > 0
    ? leads.filter((l) => l.status === 'won').reduce((s, l) => s + (l.value || 0), 0) / wonLeads
    : 0

  const topLeads = [...leads]
    .filter((l) => l.score !== null && !['won', 'lost'].includes(l.status))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5)

  const pipelineStages = [
    { name: 'Neu', status: 'new', color: 'bg-blue-500' },
    { name: 'Kontaktiert', status: 'contacted', color: 'bg-yellow-500' },
    { name: 'Qualifiziert', status: 'qualified', color: 'bg-orange-500' },
    { name: 'Proposal', status: 'proposal', color: 'bg-purple-500' },
    { name: 'Gewonnen', status: 'won', color: 'bg-green-500' },
  ].map((s) => ({
    ...s,
    count: leads.filter((l) => l.status === s.status).length,
    value: leads.filter((l) => l.status === s.status).reduce((sum, l) => sum + (l.value || 0), 0),
  }))

  async function completeFollowUp(id: string) {
    try {
      const res = await fetch('/api/sales/follow-ups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: true }),
      })
      if (res.ok) {
        setFollowUps((prev) => prev.filter((f) => f.id !== id))
      } else {
        toast('Follow-up konnte nicht abgeschlossen werden.', 'error')
      }
    } catch {
      toast('Verbindungsfehler.', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Intelligence</h1>
        <p className="text-muted-foreground mt-1">KI-gestütztes Lead-Management & Pipeline</p>
      </div>

      <InfoBox title="Sales Intelligence - So funktioniert's" variant="ai" storageKey="sales-intro">
        <p>KI-gestuetztes Lead-Management von der Akquise bis zum Abschluss.</p>
        <ul>
          <li><strong>Leads</strong> - Erstelle Leads manuell. Die KI bewertet jeden Lead automatisch mit einem Score (0-100) basierend auf Firmeninfos und Potenzial</li>
          <li><strong>Pipeline</strong> - Kanban-Board: Ziehe Leads durch die Phasen (Neu → Kontaktiert → Qualifiziert → Proposal → Gewonnen/Verloren)</li>
          <li><strong>Proposals</strong> - Lass die KI ein massgeschneidertes Angebot generieren, basierend auf dem Lead-Profil</li>
          <li><strong>Follow-ups</strong> - Plane Erinnerungen (E-Mail, Anruf, Meeting). Faellige Follow-ups erscheinen hier auf dem Dashboard</li>
          <li><strong>Forecasting</strong> - KI-Umsatzprognose basierend auf deiner Pipeline und historischen Win-Rates</li>
        </ul>
      </InfoBox>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Pipeline-Wert" value={`€${totalValue.toLocaleString('de-DE')}`} icon={<DollarSign className="w-5 h-5" />} />
        <KpiCard title="Offene Leads" value={String(openLeads)} icon={<Users className="w-5 h-5" />} />
        <KpiCard title="Win Rate" value={`${winRate}%`} icon={<TrendingUp className="w-5 h-5" />} />
        <KpiCard title="Avg. Deal-Größe" value={avgDeal > 0 ? `€${Math.round(avgDeal).toLocaleString('de-DE')}` : '—'} icon={<Target className="w-5 h-5" />} />
      </div>

      {/* Pipeline */}
      {leads.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Pipeline-Übersicht</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 h-8 rounded-lg overflow-hidden">
              {pipelineStages.filter((s) => s.count > 0).map((stage) => (
                <div
                  key={stage.status}
                  className={`${stage.color} flex items-center justify-center`}
                  style={{ flex: stage.count }}
                  title={`${stage.name}: ${stage.count} Leads (€${stage.value.toLocaleString('de-DE')})`}
                >
                  <span className="text-xs font-medium text-white">{stage.count}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              {pipelineStages.map((stage) => (
                <div key={stage.status} className="flex-1 text-center">
                  <p className="text-xs font-medium">{stage.name}</p>
                  <p className="text-xs text-muted-foreground">€{stage.value.toLocaleString('de-DE')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Leads */}
        <Card>
          <CardHeader><CardTitle>Top Leads (KI-Score)</CardTitle></CardHeader>
          <CardContent>
            {topLeads.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">Noch keine bewerteten Leads.</p>
            ) : (
              <div className="space-y-3">
                {topLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => router.push(`/dashboard/sales/leads/${lead.id}`)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted text-left transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{lead.company}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.value ? `€${lead.value.toLocaleString('de-DE')}` : 'Kein Wert'}
                      </p>
                    </div>
                    <Badge className="bg-purple-500/10 text-purple-500">{lead.score}/100</Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Follow-ups */}
        <Card>
          <CardHeader><CardTitle>Fällige Follow-ups</CardTitle></CardHeader>
          <CardContent>
            {followUps.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">Keine fälligen Follow-ups.</p>
            ) : (
              <div className="space-y-2">
                {followUps.map((fu) => (
                  <div key={fu.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{fu.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {fu.lead.company} · {fu.type} · {new Date(fu.dueDate).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => completeFollowUp(fu.id)}>
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
