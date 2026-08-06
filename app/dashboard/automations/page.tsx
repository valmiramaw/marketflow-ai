'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2, Trash2, Pencil, Workflow, Info, Zap } from 'lucide-react'

interface Automation {
  id: string
  name: string
  description: string | null
  triggerType: string
  triggerConfig: Record<string, unknown>
  actions: { type: string; config: Record<string, unknown> }[]
  enabled: boolean
  lastRunAt: string | null
  runCount: number
  createdAt: string
}

const TRIGGER_TYPES = [
  { value: 'lead_created', label: 'Neuer Lead erstellt' },
  { value: 'lead_score_high', label: 'Lead-Score hoch' },
  { value: 'keyword_dropped', label: 'Keyword-Ranking gefallen' },
  { value: 'content_published', label: 'Content veröffentlicht' },
  { value: 'weekly_schedule', label: 'Wöchentlich' },
]

const ACTION_TYPES = [
  { value: 'create_email', label: 'E-Mail-Kampagne erstellen' },
  { value: 'create_social', label: 'Social Post erstellen' },
  { value: 'update_lead_status', label: 'Lead-Status ändern' },
  { value: 'generate_report', label: 'KI-Report generieren' },
]

const WEEKDAYS = [
  { value: '1', label: 'Montag' },
  { value: '2', label: 'Dienstag' },
  { value: '3', label: 'Mittwoch' },
  { value: '4', label: 'Donnerstag' },
  { value: '5', label: 'Freitag' },
  { value: '6', label: 'Samstag' },
  { value: '0', label: 'Sonntag' },
]

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('automations-info-dismissed') !== 'true'
    }
    return true
  })
  const [form, setForm] = useState({
    name: '',
    description: '',
    triggerType: 'lead_created',
    scoreThreshold: '80',
    positions: '10',
    weekday: '1',
    actionType: 'create_email',
    newStatus: 'contacted',
  })

  useEffect(() => {
    fetchAutomations()
  }, [])

  async function fetchAutomations() {
    try {
      const res = await fetch('/api/automations')
      const data = await res.json()
      setAutomations(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  function buildPayload() {
    const triggerConfig: Record<string, unknown> = {}
    if (form.triggerType === 'lead_score_high') triggerConfig.threshold = parseInt(form.scoreThreshold)
    if (form.triggerType === 'keyword_dropped') triggerConfig.positions = parseInt(form.positions)
    if (form.triggerType === 'weekly_schedule') triggerConfig.weekday = parseInt(form.weekday)

    const actionConfig: Record<string, unknown> = {}
    if (form.actionType === 'update_lead_status') actionConfig.newStatus = form.newStatus

    return {
      name: form.name,
      description: form.description || null,
      triggerType: form.triggerType,
      triggerConfig,
      actions: [{ type: form.actionType, config: actionConfig }],
    }
  }

  async function handleSubmit() {
    try {
      const payload = buildPayload()
      if (editingId) {
        await fetch(`/api/automations/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/automations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      setDialogOpen(false)
      setEditingId(null)
      resetForm()
      fetchAutomations()
    } catch {
      // ignore
    }
  }

  async function toggleEnabled(automation: Automation) {
    try {
      await fetch(`/api/automations/${automation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !automation.enabled }),
      })
      fetchAutomations()
    } catch {
      // ignore
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/automations/${id}`, { method: 'DELETE' })
      fetchAutomations()
    } catch {
      // ignore
    }
  }

  function resetForm() {
    setForm({
      name: '', description: '', triggerType: 'lead_created',
      scoreThreshold: '80', positions: '10', weekday: '1',
      actionType: 'create_email', newStatus: 'contacted',
    })
  }

  function openEdit(a: Automation) {
    const tc = a.triggerConfig as Record<string, unknown>
    const action = a.actions[0] || { type: 'create_email', config: {} }
    const ac = action.config as Record<string, unknown>
    setForm({
      name: a.name,
      description: a.description || '',
      triggerType: a.triggerType,
      scoreThreshold: String(tc.threshold || 80),
      positions: String(tc.positions || 10),
      weekday: String(tc.weekday || 1),
      actionType: action.type,
      newStatus: String(ac.newStatus || 'contacted'),
    })
    setEditingId(a.id)
    setDialogOpen(true)
  }

  function openCreate() {
    resetForm()
    setEditingId(null)
    setDialogOpen(true)
  }

  const triggerLabel = (type: string) => TRIGGER_TYPES.find((t) => t.value === type)?.label || type
  const actionLabel = (type: string) => ACTION_TYPES.find((a) => a.value === type)?.label || type

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automatisierungen</h1>
          <p className="text-muted-foreground">Module verbinden und Workflows automatisieren</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Neue Automation
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Automation bearbeiten' : 'Neue Automation'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="z.B. High-Score Leads kontaktieren" />
              </div>
              <div>
                <Label>Trigger</Label>
                <Select value={form.triggerType} onValueChange={(v) => v && setForm({ ...form, triggerType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.triggerType === 'lead_score_high' && (
                <div>
                  <Label>Score-Schwellwert</Label>
                  <Input type="number" min="0" max="100" value={form.scoreThreshold} onChange={(e) => setForm({ ...form, scoreThreshold: e.target.value })} />
                </div>
              )}
              {form.triggerType === 'keyword_dropped' && (
                <div>
                  <Label>Positionen gefallen um</Label>
                  <Input type="number" min="1" value={form.positions} onChange={(e) => setForm({ ...form, positions: e.target.value })} />
                </div>
              )}
              {form.triggerType === 'weekly_schedule' && (
                <div>
                  <Label>Wochentag</Label>
                  <Select value={form.weekday} onValueChange={(v) => v && setForm({ ...form, weekday: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map((w) => (
                        <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Aktion</Label>
                <Select value={form.actionType} onValueChange={(v) => v && setForm({ ...form, actionType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.actionType === 'update_lead_status' && (
                <div>
                  <Label>Neuer Status</Label>
                  <Select value={form.newStatus} onValueChange={(v) => v && setForm({ ...form, newStatus: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contacted">Kontaktiert</SelectItem>
                      <SelectItem value="qualified">Qualifiziert</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Beschreibung (optional)</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Was macht diese Automation..." rows={2} />
              </div>
              <Button onClick={handleSubmit} disabled={!form.name} className="w-full">
                {editingId ? 'Speichern' : 'Erstellen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {showInfo && (
        <div className="relative rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <button
            onClick={() => { setShowInfo(false); localStorage.setItem('automations-info-dismissed', 'true') }}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          >
            &times;
          </button>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Verbinde Module miteinander. Wenn ein Trigger auslöst, führt die Automation die definierte Aktion aus. Beispiel: Wenn ein Lead-Score über 80 steigt, automatisch eine E-Mail-Kampagne erstellen.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : automations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Workflow className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Automatisierungen</h3>
            <p className="text-muted-foreground mb-4">Erstelle deine erste Automation, um Workflows zu verbinden.</p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Neue Automation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {automations.map((automation) => (
            <Card key={automation.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium">{automation.name}</h3>
                      <Badge className={automation.enabled ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}>
                        {automation.enabled ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    {automation.description && (
                      <p className="text-sm text-muted-foreground mb-2">{automation.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Trigger: {triggerLabel(automation.triggerType)}
                      </span>
                      <span>
                        Aktion: {automation.actions.map((a) => actionLabel(a.type)).join(', ')}
                      </span>
                      <span>{automation.runCount} Ausführungen</span>
                      {automation.lastRunAt && (
                        <span>Letzte: {new Date(automation.lastRunAt).toLocaleDateString('de-DE')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant={automation.enabled ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => toggleEnabled(automation)}
                    >
                      {automation.enabled ? 'Deaktivieren' : 'Aktivieren'}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(automation)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(automation.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
