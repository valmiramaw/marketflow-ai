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
import { Plus, Loader2, Trash2, Sparkles, Mail, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../components/toast'

interface EmailCampaign {
  id: string
  name: string
  subject: string
  content: string
  recipientCount: number
  status: string
  sentAt: string | null
  createdAt: string
}

interface EmailContact {
  id: string
  email: string
  name: string | null
  tags: string[]
  status: string
  createdAt: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Entwurf', color: 'bg-gray-500/10 text-gray-500' },
  scheduled: { label: 'Geplant', color: 'bg-yellow-500/10 text-yellow-500' },
  sent: { label: 'Gesendet', color: 'bg-green-500/10 text-green-500' },
}

export default function EmailPage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'contacts'>('campaigns')
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [contacts, setContacts] = useState<EmailContact[]>([])
  const [loading, setLoading] = useState(true)
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [campaignForm, setCampaignForm] = useState({ name: '', subject: '', content: '' })
  const [contactForm, setContactForm] = useState({ email: '', name: '', tags: '' })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [cRes, ctRes] = await Promise.all([
        fetch('/api/email/campaigns'),
        fetch('/api/email/contacts'),
      ])
      const [cData, ctData] = await Promise.all([cRes.json(), ctRes.json()])
      setCampaigns(cData)
      setContacts(ctData)
    } catch {
      toast('Daten konnten nicht geladen werden.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function createCampaign() {
    try {
      const res = await fetch('/api/email/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignForm),
      })
      if (res.ok) {
        setCampaignDialogOpen(false)
        setCampaignForm({ name: '', subject: '', content: '' })
        fetchData()
        toast('Kampagne erstellt!', 'success')
      } else {
        toast('Kampagne konnte nicht erstellt werden.', 'error')
      }
    } catch {
      toast('Verbindungsfehler.', 'error')
    }
  }

  async function createContact() {
    try {
      const tags = contactForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      const res = await fetch('/api/email/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: contactForm.email, name: contactForm.name || null, tags }),
      })
      if (res.ok) {
        setContactDialogOpen(false)
        setContactForm({ email: '', name: '', tags: '' })
        fetchData()
        toast('Kontakt hinzugefügt!', 'success')
      } else {
        toast('Kontakt konnte nicht erstellt werden.', 'error')
      }
    } catch {
      toast('Verbindungsfehler.', 'error')
    }
  }

  async function deleteCampaign(id: string) {
    try {
      const res = await fetch(`/api/email/campaigns/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
      else toast('Kampagne konnte nicht gelöscht werden.', 'error')
    } catch {
      toast('Verbindungsfehler.', 'error')
    }
  }

  async function deleteContact(id: string) {
    try {
      const res = await fetch(`/api/email/contacts/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
      else toast('Kontakt konnte nicht gelöscht werden.', 'error')
    } catch {
      toast('Verbindungsfehler.', 'error')
    }
  }

  async function generateContent(campaign: EmailCampaign) {
    setGeneratingId(campaign.id)
    try {
      const res = await fetch('/api/email/campaigns/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: campaign.name, subject: campaign.subject }),
      })
      if (res.ok) {
        const data = await res.json()
        await fetch(`/api/email/campaigns/${campaign.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: data.content, subject: data.subject }),
        })
        setExpandedId(campaign.id)
        fetchData()
        toast('Inhalt generiert!', 'success')
      } else {
        toast('Inhalt konnte nicht generiert werden.', 'error')
      }
    } catch {
      toast('Verbindungsfehler.', 'error')
    } finally {
      setGeneratingId(null)
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/email/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(status === 'sent' ? { sentAt: new Date().toISOString() } : {}) }),
      })
      if (res.ok) fetchData()
      else toast('Status konnte nicht geändert werden.', 'error')
    } catch {
      toast('Verbindungsfehler.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">E-Mail Marketing</h1>
          <p className="text-muted-foreground">Kampagnen erstellen und Kontakte verwalten</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <Button
          variant={activeTab === 'campaigns' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('campaigns')}
        >
          <Mail className="w-4 h-4 mr-2" />
          Kampagnen ({campaigns.length})
        </Button>
        <Button
          variant={activeTab === 'contacts' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('contacts')}
        >
          <Users className="w-4 h-4 mr-2" />
          Kontakte ({contacts.length})
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : activeTab === 'campaigns' ? (
        /* Kampagnen */
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCampaignDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Neue Kampagne
            </Button>
            <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neue E-Mail-Kampagne</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name *</Label>
                    <Input value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="z.B. Sommer-Newsletter" />
                  </div>
                  <div>
                    <Label>Betreff *</Label>
                    <Input value={campaignForm.subject} onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })} placeholder="z.B. Entdecke unsere Sommer-Kollektion" />
                  </div>
                  <div>
                    <Label>Inhalt (optional – KI füllt später)</Label>
                    <Textarea value={campaignForm.content} onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })} placeholder="E-Mail-Text..." rows={4} />
                  </div>
                  <Button onClick={createCampaign} disabled={!campaignForm.name || !campaignForm.subject} className="w-full">
                    Erstellen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Keine Kampagnen</h3>
                <p className="text-muted-foreground">Erstelle deine erste E-Mail-Kampagne.</p>
              </CardContent>
            </Card>
          ) : (
            campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Betreff: {campaign.subject}</span>
                        <Badge className={STATUS_LABELS[campaign.status]?.color || ''}>
                          {STATUS_LABELS[campaign.status]?.label || campaign.status}
                        </Badge>
                        <span>{campaign.recipientCount} Empfänger</span>
                        <span>{new Date(campaign.createdAt).toLocaleDateString('de-DE')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateContent(campaign)}
                        disabled={generatingId === campaign.id}
                      >
                        {generatingId === campaign.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-1" />
                        )}
                        KI generieren
                      </Button>
                      {campaign.status === 'draft' && (
                        <Button variant="outline" size="sm" onClick={() => updateStatus(campaign.id, 'sent')}>
                          Senden
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => deleteCampaign(campaign.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {campaign.content && (
                  <CardContent className="pt-0">
                    <button
                      onClick={() => setExpandedId(expandedId === campaign.id ? null : campaign.id)}
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      {expandedId === campaign.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {expandedId === campaign.id ? 'Vorschau ausblenden' : 'Vorschau anzeigen'}
                    </button>
                    {expandedId === campaign.id && (
                      <div className="mt-3 p-4 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                        {campaign.content}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Kontakte */
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setContactDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Kontakt hinzufügen
            </Button>
            <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neuer Kontakt</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>E-Mail *</Label>
                    <Input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="kontakt@example.com" />
                  </div>
                  <div>
                    <Label>Name</Label>
                    <Input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Max Mustermann" />
                  </div>
                  <div>
                    <Label>Tags (kommasepariert)</Label>
                    <Input value={contactForm.tags} onChange={(e) => setContactForm({ ...contactForm, tags: e.target.value })} placeholder="z.B. Newsletter, VIP, Matcha-Lover" />
                  </div>
                  <Button onClick={createContact} disabled={!contactForm.email} className="w-full">
                    Hinzufügen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {contacts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Keine Kontakte</h3>
                <p className="text-muted-foreground">Füge deinen ersten E-Mail-Kontakt hinzu.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">E-Mail</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Tags</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Datum</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((contact) => (
                        <tr key={contact.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="p-3 text-sm">{contact.email}</td>
                          <td className="p-3 text-sm text-muted-foreground">{contact.name || '–'}</td>
                          <td className="p-3">
                            <div className="flex gap-1 flex-wrap">
                              {(contact.tags as string[]).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={contact.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                              {contact.status === 'active' ? 'Aktiv' : 'Abgemeldet'}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(contact.createdAt).toLocaleDateString('de-DE')}
                          </td>
                          <td className="p-3">
                            <Button variant="ghost" size="icon" onClick={() => deleteContact(contact.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
