import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiComplete } from '@/lib/ai/router'

// POST - KI-Budget-Optimierung
export async function POST() {
  const campaigns = await prisma.campaign.findMany({
    where: { status: { in: ['active', 'paused'] } },
    include: {
      metrics: {
        orderBy: { date: 'desc' },
        take: 30,
      },
    },
  })

  if (campaigns.length === 0) {
    return NextResponse.json({
      suggestions: [],
      summary: 'Keine aktiven Kampagnen für Optimierung gefunden.',
    })
  }

  const campaignData = campaigns.map((c) => {
    const spend = c.metrics.reduce((s, m) => s + m.spend, 0)
    const revenue = c.metrics.reduce((s, m) => s + m.revenue, 0)
    const clicks = c.metrics.reduce((s, m) => s + m.clicks, 0)
    const conversions = c.metrics.reduce((s, m) => s + m.conversions, 0)

    return {
      name: c.name,
      platform: c.platform,
      status: c.status,
      budget: c.budget,
      budgetType: c.budgetType,
      spend30d: spend.toFixed(2),
      revenue30d: revenue.toFixed(2),
      roas: spend > 0 ? (revenue / spend).toFixed(2) : '0',
      clicks,
      conversions,
      cpc: clicks > 0 ? (spend / clicks).toFixed(2) : '0',
    }
  })

  const totalBudget = campaigns.reduce((s, c) => {
    return s + (c.budget ? (c.budgetType === 'daily' ? c.budget * 30 : c.budget) : 0)
  }, 0)

  const result = await aiComplete({
    taskType: 'strategy_analysis',
    messages: [
      {
        role: 'user',
        content: `Du bist ein Performance-Marketing-Experte. Analysiere diese Kampagnen und erstelle Budget-Optimierungsvorschläge.

Gesamtbudget: ${totalBudget.toFixed(2)}€/Monat
Kampagnen:
${campaignData.map((c) => `- ${c.name} (${c.platform}): Budget ${c.budget}€/${c.budgetType}, Spend ${c.spend30d}€, Revenue ${c.revenue30d}€, ROAS ${c.roas}x, ${c.conversions} Conversions`).join('\n')}

Erstelle einen detaillierten Optimierungsplan als JSON:
{
  "totalSavings": number,
  "expectedRoasImprovement": number,
  "suggestions": [
    {
      "campaignName": "...",
      "currentBudget": number,
      "suggestedBudget": number,
      "action": "increase" | "decrease" | "pause" | "maintain",
      "reason": "...",
      "expectedImpact": "..."
    }
  ],
  "generalRecommendations": ["...", "..."],
  "summary": "..."
}`,
      },
    ],
    jsonMode: true,
    temperature: 0.4,
  })

  try {
    return NextResponse.json(JSON.parse(result.content))
  } catch {
    return NextResponse.json({ summary: result.content, suggestions: [] })
  }
}
