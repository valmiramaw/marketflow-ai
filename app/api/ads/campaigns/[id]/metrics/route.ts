import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Metriken einer Kampagne
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  const since = new Date()
  since.setDate(since.getDate() - days)

  const metrics = await prisma.campaignMetric.findMany({
    where: {
      campaignId: id,
      date: { gte: since },
    },
    orderBy: { date: 'asc' },
  })

  // Aggregierte Zusammenfassung
  const summary = metrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + m.impressions,
      clicks: acc.clicks + m.clicks,
      conversions: acc.conversions + m.conversions,
      spend: acc.spend + m.spend,
      revenue: acc.revenue + m.revenue,
    }),
    { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
  )

  return NextResponse.json({
    metrics,
    summary: {
      ...summary,
      ctr: summary.impressions > 0 ? (summary.clicks / summary.impressions) * 100 : 0,
      cpc: summary.clicks > 0 ? summary.spend / summary.clicks : 0,
      roas: summary.spend > 0 ? summary.revenue / summary.spend : 0,
    },
  })
}

// POST - Metriken manuell hinzufügen (oder via Sync)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const date = new Date(body.date || new Date())
  date.setHours(0, 0, 0, 0)

  const impressions = body.impressions || 0
  const clicks = body.clicks || 0
  const spend = body.spend || 0

  const metric = await prisma.campaignMetric.upsert({
    where: {
      campaignId_date: { campaignId: id, date },
    },
    create: {
      campaignId: id,
      date,
      impressions,
      clicks,
      conversions: body.conversions || 0,
      spend,
      revenue: body.revenue || 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      roas: spend > 0 ? (body.revenue || 0) / spend : 0,
    },
    update: {
      impressions,
      clicks,
      conversions: body.conversions || 0,
      spend,
      revenue: body.revenue || 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      roas: spend > 0 ? (body.revenue || 0) / spend : 0,
    },
  })

  return NextResponse.json(metric)
}
