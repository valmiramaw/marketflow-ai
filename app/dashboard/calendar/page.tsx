'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, Plus, Trash2, Bell, BellOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'social' | 'followup' | 'email' | 'automation' | 'ads' | 'manual'
  status?: string
  meta?: Record<string, string>
}

const DAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

const TYPE_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  social: { label: 'Social Media', dot: 'bg-pink-500', badge: 'bg-pink-500/10 text-pink-500' },
  followup: { label: 'Follow-Up', dot: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-500' },
  email: { label: 'E-Mail', dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-500' },
  automation: { label: 'Automation', dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-500' },
  ads: { label: 'Ads', dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-500' },
  manual: { label: 'Manuell', dot: 'bg-sky-500', badge: 'bg-sky-500/10 text-sky-500' },
}

const COLOR_OPTIONS = [
  { value: 'sky', label: 'Blau', dot: 'bg-sky-500' },
  { value: 'red', label: 'Rot', dot: 'bg-red-500' },
  { value: 'green', label: 'Grün', dot: 'bg-green-500' },
  { value: 'violet', label: 'Violett', dot: 'bg-violet-500' },
  { value: 'rose', label: 'Rosa', dot: 'bg-rose-500' },
]

const NOTIFY_OPTIONS = [
  { value: '', label: 'Keine Benachrichtigung' },
  { value: 'now', label: 'Sofort senden' },
  { value: '15m', label: '15 Min. vorher' },
  { value: '1h', label: '1 Stunde vorher' },
  { value: '1d', label: '1 Tag vorher' },
  { value: '3d', label: '3 Tage vorher' },
]

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    color: 'sky',
    notify: '',
  })

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/calendar?year=${year}&month=${month}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events)
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    fetchEvents()
    setSelectedDay(null)
  }, [fetchEvents])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else setMonth(month - 1)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else setMonth(month + 1)
  }

  function openCreateForDay(day?: number) {
    const d = day
      ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : ''
    setNewEvent({ title: '', description: '', date: d, time: '', color: 'sky', notify: '' })
    setShowCreate(true)
  }

  async function createEvent() {
    if (!newEvent.title || !newEvent.date) return
    setCreating(true)

    const eventDate = new Date(`${newEvent.date}T${newEvent.time || '00:00'}`)

    let notifyAt: string | null = null
    if (newEvent.notify === 'now') {
      notifyAt = new Date().toISOString()
    } else if (newEvent.notify === '15m') {
      notifyAt = new Date(eventDate.getTime() - 15 * 60 * 1000).toISOString()
    } else if (newEvent.notify === '1h') {
      notifyAt = new Date(eventDate.getTime() - 60 * 60 * 1000).toISOString()
    } else if (newEvent.notify === '1d') {
      notifyAt = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000).toISOString()
    } else if (newEvent.notify === '3d') {
      notifyAt = new Date(eventDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }

    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description || null,
          date: eventDate.toISOString(),
          color: newEvent.color,
          notifyAt,
        }),
      })
      if (res.ok) {
        setShowCreate(false)
        fetchEvents()
      }
    } catch { /* ignore */ } finally {
      setCreating(false)
    }
  }

  async function deleteEvent(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/calendar/events?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchEvents()
    } catch { /* ignore */ } finally {
      setDeleting(null)
    }
  }

  // Calendar grid calculation
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()
  const startOffset = (firstDay.getDay() + 6) % 7

  // Group events by day
  const eventsByDay: Record<number, CalendarEvent[]> = {}
  for (const event of events) {
    const d = new Date(event.date)
    const day = d.getDate()
    if (!eventsByDay[day]) eventsByDay[day] = []
    eventsByDay[day].push(event)
  }

  const todayDay = now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : null
  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] || []) : []
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="w-8 h-8 text-sky-500" />
            Kalender
          </h1>
          <p className="text-muted-foreground mt-1">Alle geplanten Events auf einen Blick</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1">
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1 px-1.5">
                <div className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                <span className="text-xs text-muted-foreground">{cfg.label}</span>
              </div>
            ))}
          </div>
          <Button onClick={() => openCreateForDay()}>
            <Plus className="w-4 h-4 mr-2" />Event erstellen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <CardTitle className="text-xl">
                {MONTH_NAMES[month - 1]} {year}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-px">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {d}
                  </div>
                ))}

                {Array.from({ length: totalCells }, (_, i) => {
                  const dayNum = i - startOffset + 1
                  const isValid = dayNum >= 1 && dayNum <= daysInMonth
                  const isToday = dayNum === todayDay
                  const isSelected = dayNum === selectedDay
                  const dayEvents = isValid ? (eventsByDay[dayNum] || []) : []
                  const uniqueTypes = [...new Set(dayEvents.map((e) => e.type))]

                  return (
                    <button
                      key={i}
                      disabled={!isValid}
                      onClick={() => isValid && setSelectedDay(dayNum === selectedDay ? null : dayNum)}
                      className={cn(
                        'relative flex flex-col items-center py-2 min-h-[56px] rounded-lg transition-colors',
                        isValid ? 'hover:bg-muted cursor-pointer' : 'opacity-0 cursor-default',
                        isToday && 'bg-sky-500/10 ring-1 ring-sky-500/30',
                        isSelected && 'bg-primary/10 ring-1 ring-primary',
                      )}
                    >
                      <span className={cn(
                        'text-sm',
                        isToday && 'font-bold text-sky-500',
                        !isToday && isValid && 'text-foreground',
                      )}>
                        {isValid ? dayNum : ''}
                      </span>
                      {uniqueTypes.length > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {uniqueTypes.map((t) => (
                            <div
                              key={t}
                              className={cn('w-1.5 h-1.5 rounded-full', TYPE_CONFIG[t]?.dot || 'bg-gray-400')}
                            />
                          ))}
                        </div>
                      )}
                      {dayEvents.length > 1 && (
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {dayEvents.length}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {selectedDay
                  ? `${selectedDay}. ${MONTH_NAMES[month - 1]}`
                  : 'Tagesdetails'
                }
              </CardTitle>
              {selectedDay && (
                <Button variant="ghost" size="sm" onClick={() => openCreateForDay(selectedDay)}>
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedDay ? (
              <p className="text-sm text-muted-foreground">
                Klicke auf einen Tag, um die Events zu sehen.
              </p>
            ) : selectedEvents.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Keine Events an diesem Tag.
                </p>
                <Button variant="outline" size="sm" onClick={() => openCreateForDay(selectedDay)}>
                  <Plus className="w-4 h-4 mr-2" />Event hinzufügen
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((event) => {
                  const isManual = event.meta?.manual === 'true'
                  const manualColor = event.meta?.color
                  const manualDot = manualColor ? `bg-${manualColor}-500` : undefined
                  const cfg = isManual && manualDot
                    ? { label: 'Manuell', dot: manualDot, badge: `bg-${manualColor}-500/10 text-${manualColor}-500` }
                    : TYPE_CONFIG[event.type] || { label: event.type, dot: 'bg-gray-400', badge: 'bg-gray-500/10 text-gray-500' }
                  const time = new Date(event.date)
                  const timeStr = time.getHours() > 0 || time.getMinutes() > 0
                    ? `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
                    : null

                  return (
                    <div key={event.id} className="p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                        <Badge variant="secondary" className={cn('text-xs', cfg.badge)}>
                          {cfg.label}
                        </Badge>
                        {event.meta?.notifyAt && (
                          <span title={`Erinnerung: ${new Date(event.meta.notifyAt).toLocaleString('de-DE')}`}>
                            {event.status === 'benachrichtigt'
                              ? <BellOff className="w-3 h-3 text-muted-foreground" />
                              : <Bell className="w-3 h-3 text-sky-500" />
                            }
                          </span>
                        )}
                        <span className="ml-auto flex items-center gap-1">
                          {timeStr && (
                            <span className="text-xs text-muted-foreground">{timeStr}</span>
                          )}
                          {isManual && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-6 h-6"
                              disabled={deleting === event.id}
                              onClick={() => deleteEvent(event.id)}
                            >
                              {deleting === event.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Trash2 className="w-3 h-3 text-red-500" />
                              }
                            </Button>
                          )}
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-1">{event.title}</p>
                      {event.meta?.description && (
                        <p className="text-xs text-muted-foreground mt-1">{event.meta.description}</p>
                      )}
                      {event.status && !isManual && (
                        <span className="text-xs text-muted-foreground">{event.status}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event erstellen Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />Event erstellen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Titel *</label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent((s) => ({ ...s, title: e.target.value }))}
                placeholder="z.B. Meeting mit Kunde, Kampagne starten..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Beschreibung</label>
              <textarea
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
                value={newEvent.description}
                onChange={(e) => setNewEvent((s) => ({ ...s, description: e.target.value }))}
                placeholder="Optionale Details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Datum *</label>
                <Input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent((s) => ({ ...s, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Uhrzeit</label>
                <Input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent((s) => ({ ...s, time: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Farbe</label>
              <div className="flex gap-2 mt-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setNewEvent((s) => ({ ...s, color: c.value }))}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                      c.dot,
                      newEvent.color === c.value
                        ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110'
                        : 'opacity-60 hover:opacity-100'
                    )}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Bell className="w-4 h-4" />E-Mail-Erinnerung
              </label>
              <select
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newEvent.notify}
                onChange={(e) => setNewEvent((s) => ({ ...s, notify: e.target.value }))}
              >
                {NOTIFY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Sendet eine E-Mail an alle konfigurierten Empfänger
              </p>
            </div>

            <Button
              onClick={createEvent}
              disabled={creating || !newEvent.title || !newEvent.date}
              className="w-full"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Event erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
