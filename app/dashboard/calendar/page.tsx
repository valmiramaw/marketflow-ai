'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'social' | 'followup' | 'email' | 'automation' | 'ads'
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
}

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

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

  // Calendar grid calculation
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()
  // getDay(): 0=So, adjust to Mo=0
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

  // Total cells needed (fill grid rows)
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
        <div className="flex items-center gap-1">
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1 px-2">
              <div className={cn('w-2.5 h-2.5 rounded-full', cfg.dot)} />
              <span className="text-xs text-muted-foreground">{cfg.label}</span>
            </div>
          ))}
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
                {/* Day headers */}
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {d}
                  </div>
                ))}

                {/* Day cells */}
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
            <CardTitle className="text-lg">
              {selectedDay
                ? `${selectedDay}. ${MONTH_NAMES[month - 1]}`
                : 'Tagesdetails'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDay ? (
              <p className="text-sm text-muted-foreground">
                Klicke auf einen Tag, um die Events zu sehen.
              </p>
            ) : selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keine Events an diesem Tag.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((event) => {
                  const cfg = TYPE_CONFIG[event.type] || { label: event.type, dot: 'bg-gray-400', badge: 'bg-gray-500/10 text-gray-500' }
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
                        {timeStr && (
                          <span className="text-xs text-muted-foreground ml-auto">{timeStr}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-1">{event.title}</p>
                      {event.status && (
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
    </div>
  )
}
