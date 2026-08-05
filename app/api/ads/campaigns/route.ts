import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Alle Kampagnen auflisten
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform')
  const status = searchParams.get('status')

  const where: Record<string, string> = {}
  if (platform) where.platform = platform
  if (status) where.status = status

  const campaigns = await prisma.campaign.findMany({
    where,
    include: {
      metrics: {
        orderBy: { date: 'desc' },
        take: 30,
      },
      _count: { select: { adGroups: true, abTests: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Aggregierte Metriken berechnen
  const enriched = campaigns.map((c) => {
    const totalMetrics = c.metrics.reduce(
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
      ? (totalMetrics.clicks / totalMetrics.impressions) * 100
      : 0
    const cpc = totalMetrics.clicks > 0
      ? totalMetrics.spend / totalMetrics.clicks
      : 0
    const roas = totalMetrics.spend > 0
      ? totalMetrics.revenue / totalMetrics.spend
      : 0

    return {
      id: c.id,
      externalId: c.externalId,
      platform: c.platform,
      name: c.name,
      status: c.status,
      objective: c.objective,
      budget: c.budget,
      budgetType: c.budgetType,
      startDate: c.startDate,
      endDate: c.endDate,
      aiScore: c.aiScore,
      aiInsights: c.aiInsights,
      adGroupCount: c._count.adGroups,
      abTestCount: c._count.abTests,
      totalSpend: totalMetrics.spend,
      totalRevenue: totalMetrics.revenue,
      totalImpressions: totalMetrics.impressions,
      totalClicks: totalMetrics.clicks,
      totalConversions: totalMetrics.conversions,
      ctr,
      cpc,
      roas,
    }
  })

  return NextResponse.json(enriched)
}

// POST - Neue Kampagne erstellen
export async function POST(request: NextRequest) {
  const body = await request.json()

  const campaign = await prisma.campaign.create({
    data: {
      platform: body.platform || 'google',
      name: body.name,
      status: body.status || 'draft',
      objective: body.objective || null,
      budget: body.budget ? parseFloat(body.budget) : null,
      budgetType: body.budgetType || 'daily',
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  })

  return NextResponse.json(campaign, { status: 201 })
}
