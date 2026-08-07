'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, DollarSign, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '../../components/toast'

interface Lead {
  id: string
  company: string
  contactName: string | null
  email: string | null
  status: string
  score: number | null
  value: number | null
  source: string | null
}

const stages = [
  { id: 'new', label: 'Neu', color: 'border-t-blue-500' },
  { id: 'contacted', label: 'Kontaktiert', color: 'border-t-yellow-500' },
  { id: 'qualified', label: 'Qualifiziert', color: 'border-t-orange-500' },
  { id: 'proposal', label: 'Proposal', color: 'border-t-purple-500' },
  { id: 'negotiation', label: 'Verhandlung', color: 'border-t-indigo-500' },
  { id: 'won', label: 'Gewonnen', color: 'border-t-green-500' },
  { id: 'lost', label: 'Verloren', color: 'border-t-red-500' },
]

export default function PipelinePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedLead, setDraggedLead] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)

  useEffect(() => {
    fetchLeads()
  }, [])

  async function fetchLeads() {
    try {
      const res = await fetch('/api/sales/leads')
      if (res.ok) setLeads(await res.json())
    } catch {
      toast('Leads konnten nicht geladen werden.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function moveToStage(leadId: string, newStatus: string) {
    const prevLeads = leads
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    )
    try {
      const res = await fetch(`/api/sales/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        setLeads(prevLeads)
        toast('Status konnte nicht geändert werden.', 'error')
      }
    } catch {
      setLeads(prevLeads)
      toast('Verbindungsfehler.', 'error')
    }
  }

  function handleDragStart(e: React.DragEvent, leadId: string) {
    setDraggedLead(leadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, stageId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stageId)
  }

  function handleDragLeave() {
    setDragOverStage(null)
  }

  function handleDrop(e: React.DragEvent, stageId: string) {
    e.preventDefault()
    setDragOverStage(null)
    if (draggedLead) {
      moveToStage(draggedLead, stageId)
      setDraggedLead(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const getStageLeads = (stageId: string) => leads.filter((l) => l.status === stageId)
  const getStageValue = (stageId: string) =>
    getStageLeads(stageId).reduce((sum, l) => sum + (l.value || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pipeline</h1>
        <p className="text-muted-foreground mt-1">
          Drag & Drop um Leads zwischen Stufen zu verschieben
        </p>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {stages.map((stage) => {
          const count = getStageLeads(stage.id).length
          const value = getStageValue(stage.id)
          return (
            <div key={stage.id} className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">{stage.label}</p>
              <p className="text-lg font-bold">{count}</p>
              {value > 0 && (
                <p className="text-xs text-muted-foreground">
                  €{value.toLocaleString('de-DE')}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageLeads = getStageLeads(stage.id)
          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-72"
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <Card className={cn(
                'border-t-2 transition-colors',
                stage.color,
                dragOverStage === stage.id && 'ring-2 ring-primary/50 bg-primary/5'
              )}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
                    <Badge variant="secondary">{stageLeads.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 min-h-[200px]">
                  {stageLeads.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      Keine Leads
                    </p>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => router.push(`/dashboard/sales/leads/${lead.id}`)}
                        className={cn(
                          'p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-grab active:cursor-grabbing transition-opacity',
                          draggedLead === lead.id && 'opacity-50'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{lead.company}</p>
                            {lead.contactName && (
                              <p className="text-xs text-muted-foreground truncate">{lead.contactName}</p>
                            )}
                          </div>
                          <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {lead.score !== null && (
                            <Badge variant="secondary" className="text-[10px]">
                              <Sparkles className="w-3 h-3 mr-0.5" />{lead.score}
                            </Badge>
                          )}
                          {lead.value && (
                            <Badge variant="secondary" className="text-[10px]">
                              <DollarSign className="w-3 h-3 mr-0.5" />
                              {lead.value.toLocaleString('de-DE')}
                            </Badge>
                          )}
                          {lead.source && (
                            <Badge variant="outline" className="text-[10px]">
                              {lead.source}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
