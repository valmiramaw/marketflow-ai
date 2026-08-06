import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiComplete } from '@/lib/ai/router'

// GET - Forecasting-Daten
export async function GET() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const wonDeals = leads.filter((l) => l.status === 'won')
  const activeDeals = leads.filter((l) => !['lost', 'won'].includes(l.status))

  // Basis-Statistiken
  const avgDealValue = wonDeals.length > 0
    ? wonDeals.reduce((s, l) => s + (l.value || 0), 0) / wonDeals.length
    : 0

  // Win-Rate berechnen
  const closedDeals = leads.filter((l) => ['won', 'lost'].includes(l.status))
  const winRate = closedDeals.length > 0
    ? (wonDeals.length / closedDeals.length) * 100
    : 0

  // Pipeline nach Status
  const pipelineByStatus = {
    new: activeDeals.filter((l) => l.status === 'new').length,
    contacted: activeDeals.filter((l) => l.status === 'contacted').length,
    qualified: activeDeals.filter((l) => l.status === 'qualified').length,
    proposal: activeDeals.filter((l) => l.status === 'proposal').length,
    negotiation: activeDeals.filter((l) => l.status === 'negotiation').length,
  }

  // Gewichteter Pipeline-Wert (Stage-basiert)
  const stageWeights: Record<string, number> = {
    new: 0.1,
    contacted: 0.2,
    qualified: 0.4,
    proposal: 0.6,
    negotiation: 0.8,
  }

  const weightedPipeline = activeDeals.reduce((sum, lead) => {
    const weight = stageWeights[lead.status] || 0.1
    return sum + (lead.value || 0) * weight
  }, 0)

  // Monatliche Deals (letzte 6 Monate)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const monthlyWins = new Map<string, { count: number; value: number }>()
  for (const deal of wonDeals) {
    if (deal.updatedAt >= sixMonthsAgo) {
      const month = deal.updatedAt.toISOString().slice(0, 7)
      const existing = monthlyWins.get(month) || { count: 0, value: 0 }
      monthlyWins.set(month, {
        count: existing.count + 1,
        value: existing.value + (deal.value || 0),
      })
    }
  }

  const monthlyTrend = Array.from(monthlyWins.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))

  return NextResponse.json({
    summary: {
      totalLeads: leads.length,
      activeDeals: activeDeals.length,
      wonDeals: wonDeals.length,
      avgDealValue,
      winRate,
      pipelineValue: activeDeals.reduce((s, l) => s + (l.value || 0), 0),
      weightedPipeline,
    },
    pipelineByStatus,
    monthlyTrend,
    hasEnoughData: wonDeals.length >= 5,
  })
}

// POST - KI-Forecast generieren
export async function POST() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const wonDeals = leads.filter((l) => l.status === 'won')
  const activeDeals = leads.filter((l) => !['lost', 'won'].includes(l.status))
  const closedDeals = leads.filter((l) => ['won', 'lost'].includes(l.status))

  if (wonDeals.length < 3) {
    return NextResponse.json({
      error: 'Mindestens 3 abgeschlossene Deals nötig für eine Prognose.',
    }, { status: 400 })
  }

  const avgDealValue = wonDeals.reduce((s, l) => s + (l.value || 0), 0) / wonDeals.length
  const winRate = closedDeals.length > 0 ? (wonDeals.length / closedDeals.length) * 100 : 0

  const result = await aiComplete({
    taskType: 'data_extraction',
    messages: [
      {
        role: 'user',
        content: `Erstelle eine Sales-Prognose basierend auf diesen Daten:

Historische Daten:
- ${wonDeals.length} gewonnene Deals, Durchschnittswert: ${avgDealValue.toFixed(2)}€
- Win-Rate: ${winRate.toFixed(1)}%
- Gesamte Leads: ${leads.length}

Aktive Pipeline:
${activeDeals.map((l) => `- ${l.company || 'Unbekannt'}: ${l.status}, Wert: ${(l.value || 0).toFixed(2)}€, Score: ${l.score || 'k.A.'}`).join('\n')}

Antworte als JSON:
{
  "quarterForecast": number,
  "expectedDeals": number,
  "confidence": number,
  "avgCloseTime": "... Tage",
  "topOpportunities": [
    { "company": "...", "probability": number, "value": number }
  ],
  "risks": ["..."],
  "recommendations": ["..."]
}`,
      },
    ],
    jsonMode: true,
    temperature: 0.3,
  })

  try {
    return NextResponse.json(JSON.parse(result.content))
  } catch {
    return NextResponse.json({ forecast: result.content })
  }
}
