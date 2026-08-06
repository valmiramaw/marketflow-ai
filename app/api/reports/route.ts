import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiComplete } from '@/lib/ai/router'

// GET - Alle Wochenberichte
export async function GET() {
  const reports = await prisma.weeklyReport.findMany({
    orderBy: { weekStart: 'desc' },
    take: 12,
  })

  return NextResponse.json(reports)
}

// POST - Neuen Wochenbericht generieren
export async function POST() {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Montag
  weekStart.setHours(0, 0, 0, 0)

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Alle Daten der letzten Woche sammeln
  const [campaigns, metrics, keywords, leads, aiUsage, syncs, contentPlans] = await Promise.all([
    prisma.campaign.findMany({ where: { status: 'active' } }),
    prisma.campaignMetric.findMany({ where: { date: { gte: sevenDaysAgo } } }),
    prisma.trackedKeyword.findMany(),
    prisma.lead.findMany({ where: { updatedAt: { gte: sevenDaysAgo } } }),
    prisma.aiUsageLog.findMany({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.syncLog.findMany({
      where: { startedAt: { gte: sevenDaysAgo } },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.contentPlan.findMany(),
  ])

  // Metriken aggregieren
  const weeklySpend = metrics.reduce((s, m) => s + m.spend, 0)
  const weeklyRevenue = metrics.reduce((s, m) => s + m.revenue, 0)
  const weeklyClicks = metrics.reduce((s, m) => s + m.clicks, 0)
  const weeklyConversions = metrics.reduce((s, m) => s + m.conversions, 0)
  const top10 = keywords.filter((k) => k.currentRank && k.currentRank <= 10).length
  const newLeads = leads.filter((l) => l.createdAt >= sevenDaysAgo).length
  const wonDeals = leads.filter((l) => l.status === 'won' && l.updatedAt >= sevenDaysAgo)
  const pipelineValue = leads
    .filter((l) => !['lost', 'won'].includes(l.status))
    .reduce((s, l) => s + (l.value || 0), 0)

  const metricsData = {
    ads: {
      activeCampaigns: campaigns.length,
      spend: weeklySpend,
      revenue: weeklyRevenue,
      roas: weeklySpend > 0 ? weeklyRevenue / weeklySpend : 0,
      clicks: weeklyClicks,
      conversions: weeklyConversions,
    },
    seo: {
      totalKeywords: keywords.length,
      top10,
      contentInProgress: contentPlans.filter((c) => c.status === 'writing').length,
    },
    sales: {
      newLeads,
      wonDeals: wonDeals.length,
      wonValue: wonDeals.reduce((s, l) => s + (l.value || 0), 0),
      pipelineValue,
    },
    ai: {
      calls: aiUsage.length,
      tokens: aiUsage.reduce((s, u) => s + u.tokens, 0),
    },
    syncs: {
      total: syncs.length,
      errors: syncs.filter((s) => s.status === 'error').length,
    },
  }

  // KI-Wochenbericht generieren
  const result = await aiComplete({
    taskType: 'report_generation',
    messages: [
      {
        role: 'user',
        content: `Erstelle einen professionellen Wochenbericht für die KW ${getWeekNumber(weekStart)} (${weekStart.toISOString().split('T')[0]}).

DATEN DER WOCHE:

PERFORMANCE MARKETING:
- ${campaigns.length} aktive Kampagnen
- Ausgaben: ${weeklySpend.toFixed(2)}€
- Umsatz: ${weeklyRevenue.toFixed(2)}€
- ROAS: ${weeklySpend > 0 ? (weeklyRevenue / weeklySpend).toFixed(2) : 0}x
- ${weeklyClicks} Klicks, ${weeklyConversions} Conversions

SEO & CONTENT:
- ${keywords.length} getrackte Keywords, ${top10} in Top 10
- ${contentPlans.filter((c) => c.status === 'writing').length} Artikel in Bearbeitung
- ${contentPlans.filter((c) => c.status === 'published').length} veröffentlicht

SALES:
- ${newLeads} neue Leads
- ${wonDeals.length} gewonnene Deals (${wonDeals.reduce((s, l) => s + (l.value || 0), 0).toFixed(2)}€)
- Pipeline-Wert: ${pipelineValue.toFixed(2)}€

KI-NUTZUNG:
- ${aiUsage.length} KI-Aufrufe
- ${aiUsage.reduce((s, u) => s + u.tokens, 0).toLocaleString('de-DE')} Tokens verbraucht

SYNC-STATUS:
- ${syncs.length} Synchronisierungen, ${syncs.filter((s) => s.status === 'error').length} Fehler

Erstelle einen strukturierten Bericht mit:
1. Executive Summary (3-4 Sätze)
2. Highlights der Woche
3. Handlungsbedarf
4. Empfehlungen für nächste Woche
5. KPI-Zusammenfassung

Format: Markdown`,
      },
    ],
    temperature: 0.5,
  })

  // Report speichern
  const report = await prisma.weeklyReport.upsert({
    where: { weekStart },
    create: {
      weekStart,
      content: result.content,
      metrics: metricsData,
    },
    update: {
      content: result.content,
      metrics: metricsData,
    },
  })

  return NextResponse.json(report, { status: 201 })
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
