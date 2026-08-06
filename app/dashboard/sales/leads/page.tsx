'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Search, Sparkles } from 'lucide-react'
import { InfoBox } from '../../components/info-box'

interface Lead {
  id: string
  company: string
  contactName: string | null
  email: string | null
  phone: string | null
  website: string | null
  source: string | null
  status: string
  score: number | null
  value: number | null
  notes: string | null
  createdAt: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: 'Neu', color: 'bg-blue-500/10 text-blue-500' },
  contacted: { label: 'Kontaktiert', color: 'bg-yellow-500/10 text-yellow-500' },
  qualified: { label: 'Qualifiziert', color: 'bg-orange-500/10 text-orange-500' },
  proposal: { label: 'Proposal', color: 'bg-purple-500/10 text-purple-500' },
  won: { label: 'Gewonnen', color: 'bg-green-500/10 text-green-500' },
  lost: { label: 'Verloren', color: 'bg-red-500/10 text-red-500' },
}

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchLeads()
  }, [])

  async function fetchLeads() {
    try {
      const res = await fetch('/api/sales/leads')
      if (res.ok) {
        const data = await res.json()
        setLeads(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function createLead(formData: FormData) {
    const body = {
      company: formData.get('company'),
      contactName: formData.get('contactName') || null,
      email: formData.get('email') || null,
      phone: formData.get('phone') || null,
      website: formData.get('website') || null,
      source: formData.get('source') || null,
      notes: formData.get('notes') || null,
      value: formData.get('value') ? parseFloat(formData.get('value') as string) : null,
    }

    const res = await fetch('/api/sales/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setShowNew(false)
      fetchLeads()
    }
  }

  const filtered = leads.filter(
    (l) =>
      l.company.toLowerCase().includes(search.toLowerCase()) ||
      l.contactName?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground mt-1">{leads.length} Leads gesamt</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-2" />Neuer Lead
        </Button>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Lead erstellen</DialogTitle>
            </DialogHeader>
            <form action={createLead} className="space-y-4">
              <div>
                <Label htmlFor="company">Firma *</Label>
                <Input id="company" name="company" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName">Ansprechpartner</Label>
                  <Input id="contactName" name="contactName" />
                </div>
                <div>
                  <Label htmlFor="email">E-Mail</Label>
                  <Input id="email" name="email" type="email" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div>
                  <Label htmlFor="value">Deal-Wert (€)</Label>
                  <Input id="value" name="value" type="number" step="0.01" />
                </div>
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" />
              </div>
              <div>
                <Label htmlFor="source">Quelle</Label>
                <Input id="source" name="source" placeholder="website, referral, cold, ad" />
              </div>
              <div>
                <Label htmlFor="notes">Notizen</Label>
                <Textarea id="notes" name="notes" />
              </div>
              <Button type="submit" className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />Lead erstellen & KI-Scoring
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Leads durchsuchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <InfoBox title="KI Lead-Scoring & Analyse" variant="ai" storageKey="leads-tip">
        <p>Erstelle einen Lead und klicke auf <strong>Sparkles</strong>, um den KI-Score zu berechnen. Die KI bewertet den Lead (0-100) basierend auf Firmenname, Branche, Website und Deal-Wert. In der Lead-Detailseite kannst du ausserdem ein <strong>KI-Firmenprofile</strong> und ein <strong>Proposal</strong> generieren lassen.</p>
      </InfoBox>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Firma</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Kontakt</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">KI-Score</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Wert</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Quelle</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">Laden...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      {leads.length === 0
                        ? 'Noch keine Leads. Erstelle deinen ersten Lead.'
                        : 'Keine Ergebnisse.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead) => {
                    const st = statusLabels[lead.status] || statusLabels.new
                    return (
                      <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/dashboard/sales/leads/${lead.id}`)}>
                        <td className="p-4">
                          <p className="font-medium">{lead.company}</p>
                          {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                        </td>
                        <td className="p-4 text-muted-foreground">{lead.contactName || '—'}</td>
                        <td className="p-4">
                          <Badge className={st.color}>{st.label}</Badge>
                        </td>
                        <td className="p-4 text-right font-medium">
                          {lead.score !== null ? `${lead.score}/100` : '—'}
                        </td>
                        <td className="p-4 text-right">
                          {lead.value ? `€${lead.value.toLocaleString('de-DE')}` : '—'}
                        </td>
                        <td className="p-4 text-muted-foreground">{lead.source || '—'}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
