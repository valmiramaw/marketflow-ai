'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft, Sparkles, Loader2, Mail, Phone, Globe, User,
  Calendar, DollarSign, FileSignature, CheckCircle, Clock,
  MessageSquare, PhoneCall, Users, PenLine,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '../../../components/toast'

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
  aiProfile: string | null
  nextFollowUp: string | null
  createdAt: string
  activities: Activity[]
  followUps: FollowUp[]
  proposals: Proposal[]
}

interface Activity {
  id: string
  type: string
  subject: string
  content: string | null
  createdAt: string
}

interface FollowUp {
  id: string
  type: string
  subject: string
  description: string | null
  dueDate: string
  completed: boolean
}

interface Proposal {
  id: string
  title: string
  content: string
  value: number | null
  status: string
  createdAt: string
}

const statusOptions = [
  { value: 'new', label: 'Neu', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Kontaktiert', color: 'bg-yellow-500' },
  { value: 'qualified', label: 'Qualifiziert', color: 'bg-orange-500' },
  { value: 'proposal', label: 'Proposal', color: 'bg-purple-500' },
  { value: 'won', label: 'Gewonnen', color: 'bg-green-500' },
  { value: 'lost', label: 'Verloren', color: 'bg-red-500' },
]

const activityIcons: Record<string, React.ElementType> = {
  email: Mail,
  call: PhoneCall,
  meeting: Users,
  note: PenLine,
  status_change: CheckCircle,
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState(false)
  const [generatingProposal, setGeneratingProposal] = useState(false)
  const [showFollowUpForm, setShowFollowUpForm] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [showProposal, setShowProposal] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchLead()
  }, [id])

  async function fetchLead() {
    try {
      const res = await fetch(`/api/sales/leads/${id}`)
      if (res.ok) setLead(await res.json())
    } catch {
      toast('Lead konnte nicht geladen werden.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(newStatus: string) {
    try {
      const res = await fetch(`/api/sales/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) fetchLead()
      else toast('Status konnte nicht geändert werden.', 'error')
    } catch {
      toast('Verbindungsfehler.', 'error')
    }
  }

  async function runScoring() {
    setScoring(true)
    try {
      const res = await fetch(`/api/sales/leads/${id}/score`, { method: 'POST' })
      if (res.ok) {
        fetchLead()
        toast('KI-Scoring abgeschlossen!', 'success')
      } else {
        toast('Scoring konnte nicht durchgeführt werden.', 'error')
      }
    } catch {
      toast('Verbindungsfehler.', 'error')
    } finally {
      setScoring(false)
    }
  }

  async function generateProposal() {
    setGeneratingProposal(true)
    try {
      const res = await fetch('/api/sales/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: id }),
      })
      if (res.ok) {
        fetchLead()
        toast('Proposal generiert!', 'success')
      } else {
        toast('Proposal konnte nicht generiert werden.', 'error')
      }
    } catch {
      toast('Verbindungsfehler.', 'error')
    } finally {
      setGeneratingProposal(false)
    }
  }

  async function createFollowUp(formData: FormData) {
    try {
      const res = await fetch('/api/sales/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: id,
          type: formData.get('type'),
          subject: formData.get('subject'),
          dueDate: formData.get('dueDate'),
          description: formData.get('description') || null,
        }),
      })
      if (res.ok) {
        setShowFollowUpForm(false)
        fetchLead()
      } else {
        toast('Follow-up konnte nicht erstellt werden.', 'error')
      }
    } catch {
      toast('Verbindungsfehler.', 'error')
    }
  }

  async function completeFollowUp(followUpId: string) {
    try {
      const res = await fetch('/api/sales/follow-ups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: followUpId, completed: true }),
      })
      if (res.ok) fetchLead()
      else toast('Follow-up konnte nicht abgeschlossen werden.', 'error')
    } catch {
      toast('Verbindungsfehler.', 'error')
    }
  }

  async function addActivity(formData: FormData) {
    try {
      const res = await fetch(`/api/sales/leads/${id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.get('type'),
          subject: formData.get('subject'),
          content: formData.get('content') || null,
        }),
      })
      if (res.ok) {
        setShowActivityForm(false)
        fetchLead()
      } else {
        toast('Aktivität konnte nicht hinzugefügt werden.', 'error')
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

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Lead nicht gefunden.</p>
        <Button variant="ghost" onClick={() => router.push('/dashboard/sales/leads')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />Zurück zu Leads
        </Button>
      </div>
    )
  }

  const currentStatus = statusOptions.find((s) => s.value === lead.status) || statusOptions[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/sales/leads')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{lead.company}</h1>
            <div className="flex items-center gap-3 mt-1">
              {lead.contactName && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <User className="w-4 h-4" />{lead.contactName}
                </span>
              )}
              {lead.email && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Mail className="w-4 h-4" />{lead.email}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runScoring} disabled={scoring}>
            {scoring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            KI-Scoring
          </Button>
          <Button onClick={generateProposal} disabled={generatingProposal}>
            {generatingProposal ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSignature className="w-4 h-4 mr-2" />}
            Proposal generieren
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info + Status */}
        <div className="space-y-6">
          {/* Status Pipeline */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Status</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateStatus(opt.value)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                      lead.status === opt.value
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-muted-foreground'
                    )}
                  >
                    <div className={cn('w-3 h-3 rounded-full', opt.color)} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lead Info */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span>{lead.website}</span>
                </div>
              )}
              {lead.value && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>€{lead.value.toLocaleString('de-DE')}</span>
                </div>
              )}
              {lead.source && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>Quelle: {lead.source}</span>
                </div>
              )}
              {lead.score !== null && (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  <span>KI-Score: <strong>{lead.score}/100</strong></span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Erstellt: {new Date(lead.createdAt).toLocaleDateString('de-DE')}</span>
              </div>
            </CardContent>
          </Card>

          {/* KI-Profil */}
          {lead.aiProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />KI-Profil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.aiProfile}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Center: Activity Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Follow-ups */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Follow-ups</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowFollowUpForm(!showFollowUpForm)}>
                {showFollowUpForm ? 'Abbrechen' : 'Neues Follow-up'}
              </Button>
            </CardHeader>
            <CardContent>
              {showFollowUpForm && (
                <form action={createFollowUp} className="space-y-3 mb-4 p-3 rounded-lg bg-muted/50 border">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="fu-type">Typ</Label>
                      <select name="type" id="fu-type" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                        <option value="email">E-Mail</option>
                        <option value="call">Anruf</option>
                        <option value="meeting">Meeting</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="fu-date">Datum</Label>
                      <Input id="fu-date" name="dueDate" type="date" required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="fu-subject">Betreff</Label>
                    <Input id="fu-subject" name="subject" required />
                  </div>
                  <div>
                    <Label htmlFor="fu-desc">Beschreibung</Label>
                    <Textarea id="fu-desc" name="description" rows={2} />
                  </div>
                  <Button type="submit" size="sm">Erstellen</Button>
                </form>
              )}

              {lead.followUps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Keine Follow-ups geplant.</p>
              ) : (
                <div className="space-y-2">
                  {lead.followUps.map((fu) => (
                    <div key={fu.id} className={cn(
                      'flex items-center justify-between p-3 rounded-lg border',
                      fu.completed ? 'opacity-50' : ''
                    )}>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{fu.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {fu.type} · {new Date(fu.dueDate).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                      {!fu.completed && (
                        <Button variant="ghost" size="sm" onClick={() => completeFollowUp(fu.id)}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Proposals */}
          {lead.proposals.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Proposals</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {lead.proposals.map((p) => (
                  <div key={p.id}>
                    <button
                      onClick={() => setShowProposal(showProposal === p.id ? null : p.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 text-left"
                    >
                      <div>
                        <p className="text-sm font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString('de-DE')} · {p.status}
                        </p>
                      </div>
                      <Badge variant="secondary">{p.status}</Badge>
                    </button>
                    {showProposal === p.id && (
                      <div className="mt-2 p-4 rounded-lg bg-muted/50 border text-sm whitespace-pre-wrap">
                        {p.content}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Aktivitäten</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowActivityForm(!showActivityForm)}>
                {showActivityForm ? 'Abbrechen' : 'Aktivität hinzufügen'}
              </Button>
            </CardHeader>
            <CardContent>
              {showActivityForm && (
                <form action={addActivity} className="space-y-3 mb-4 p-3 rounded-lg bg-muted/50 border">
                  <div>
                    <Label htmlFor="act-type">Typ</Label>
                    <select name="type" id="act-type" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="note">Notiz</option>
                      <option value="email">E-Mail</option>
                      <option value="call">Anruf</option>
                      <option value="meeting">Meeting</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="act-subject">Betreff</Label>
                    <Input id="act-subject" name="subject" required />
                  </div>
                  <div>
                    <Label htmlFor="act-content">Details</Label>
                    <Textarea id="act-content" name="content" rows={2} />
                  </div>
                  <Button type="submit" size="sm">Hinzufügen</Button>
                </form>
              )}

              {lead.activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Keine Aktivitäten.</p>
              ) : (
                <div className="space-y-4">
                  {lead.activities.map((activity) => {
                    const Icon = activityIcons[activity.type] || MessageSquare
                    return (
                      <div key={activity.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.subject}</p>
                          {activity.content && (
                            <p className="text-sm text-muted-foreground mt-0.5">{activity.content}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.createdAt).toLocaleString('de-DE')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
