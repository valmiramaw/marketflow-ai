import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiComplete } from '@/lib/ai/router'

// POST - KI-Analyse einer Kampagne
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      metrics: {
        orderBy: { date: 'desc' },
        take: 30,
      },
    },
  })

  if (!campaign) {
    return NextResponse.json({ error: 'Kampagne nicht gefunden' }, { status: 404 })
  }

  const totalMetrics = campaign.metrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + m.impressions,
      clicks: acc.clicks + m.clicks,
      conversions: acc.conversions + m.conversions,
      spend: acc.spend + m.spend,
      revenue: acc.revenue + m.revenue,
    }),
    { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
  )

  const ctr = totalMetrics.impressions > 0
    ? ((totalMetrics.clicks / totalMetrics.impressions) * 100).toFixed(2)
    : '0'
  const roas = totalMetrics.spend > 0
    ? (totalMetrics.revenue / totalMetrics.spend).toFixed(2)
    : '0'

  const result = await aiComplete({
    taskType: 'data_extraction',
    messages: [
      {
        role: 'user',
        content: `Analysiere diese Werbekampagne und gib ein JSON zurück:

Kampagne: ${campaign.name}
Plattform: ${campaign.platform}
Status: ${campaign.status}
Budget: ${campaign.budget}€ (${campaign.budgetType})
Zeitraum: ${campaign.startDate?.toISOString().split('T')[0]} - ${campaign.endDate?.toISOString().split('T')[0] || 'laufend'}

Metriken (letzte 30 Tage):
- Impressionen: ${totalMetrics.impressions.toLocaleString('de-DE')}
- Klicks: ${totalMetrics.clicks.toLocaleString('de-DE')}
- CTR: ${ctr}%
- Conversions: ${totalMetrics.conversions}
- Ausgaben: ${totalMetrics.spend.toFixed(2)}€
- Umsatz: ${totalMetrics.revenue.toFixed(2)}€
- ROAS: ${roas}x

Täglicher Trend (letzte 7 Tage):
${campaign.metrics.slice(0, 7).map((m) => `${m.date.toISOString().split('T')[0]}: ${m.clicks} Klicks, ${m.spend.toFixed(2)}€, ROAS ${m.roas?.toFixed(2) || 0}x`).join('\n')}

Antworte als JSON:
{
  "score": 0-100,
  "trend": "up" | "down" | "stable",
  "insights": ["...", "..."],
  "recommendations": ["...", "..."],
  "budgetSuggestion": { "action": "increase" | "decrease" | "maintain", "amount": number, "reason": "..." }
}`,
      },
    ],
    jsonMode: true,
    temperature: 0.3,
  })

  try {
    const analysis = JSON.parse(result.content)

    // Score + Insights in DB speichern
    await prisma.campaign.update({
      where: { id },
      data: {
        aiScore: analysis.score || null,
        aiInsights: result.content,
      },
    })

    return NextResponse.json(analysis)
  } catch {
    return NextResponse.json({
      score: null,
      insights: [result.content],
      recommendations: [],
    })
  }
}
