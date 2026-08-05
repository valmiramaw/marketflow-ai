'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileSignature } from 'lucide-react'

interface Proposal {
  id: string
  title: string
  content: string
  value: number | null
  status: string
  createdAt: string
  lead: { id: string; company: string; contactName: string | null }
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Entwurf', color: 'bg-gray-500/10 text-gray-500' },
  sent: { label: 'Gesendet', color: 'bg-blue-500/10 text-blue-500' },
  accepted: { label: 'Angenommen', color: 'bg-green-500/10 text-green-500' },
  rejected: { label: 'Abgelehnt', color: 'bg-red-500/10 text-red-500' },
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/sales/proposals')
      .then((r) => r.ok ? r.json() : [])
      .then(setProposals)
      .finally(() => setLoading(false))
  }, [])

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
        <h1 className="text-3xl font-bold">Proposals</h1>
        <p className="text-muted-foreground mt-1">
          {proposals.length} KI-generierte Angebote
        </p>
      </div>

      {proposals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileSignature className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Noch keine Proposals. Öffne einen Lead und klicke &quot;Proposal generieren&quot;.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => {
            const st = statusLabels[p.status] || statusLabels.draft
            return (
              <Card key={p.id}>
                <CardHeader>
                  <button
                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{p.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {p.lead.company} · {new Date(p.createdAt).toLocaleDateString('de-DE')}
                          {p.value && ` · €${p.value.toLocaleString('de-DE')}`}
                        </p>
                      </div>
                      <Badge className={st.color}>{st.label}</Badge>
                    </div>
                  </button>
                </CardHeader>
                {expanded === p.id && (
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {p.content}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
