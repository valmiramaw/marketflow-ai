import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getGoogleAccessToken } from '@/lib/integrations/google/oauth'
import { getCampaigns, getCampaignMetrics, microsToEuros } from '@/lib/integrations/google/ads'

export async function GET(request: NextRequest) {
  // Cron-Secret prüfen
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const syncLog = await prisma.syncLog.create({
    data: { type: 'ads', provider: 'google', status: 'running' },
  })

  try {
    const token = await getGoogleAccessToken()

    if (!token) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { status: 'error', details: 'Google nicht verbunden', endedAt: new Date() },
      })
      return NextResponse.json({ status: 'skipped', reason: 'Google nicht verbunden' })
    }

    let itemCount = 0
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID

    if (!customerId) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { status: 'error', details: 'GOOGLE_ADS_CUSTOMER_ID nicht gesetzt', endedAt: new Date() },
      })
      return NextResponse.json({ status: 'skipped', reason: 'Kein Google Ads Customer ID' })
    }

    // 1. Kampagnen synchen
    const googleCampaigns = await getCampaigns(customerId)

    for (const gc of googleCampaigns) {
      const existing = await prisma.campaign.findFirst({
        where: { externalId: gc.id },
      })

      const status = gc.status === 'enabled' ? 'active' : gc.status === 'paused' ? 'paused' : 'ended'
      const budget = gc.budgetAmountMicros ? microsToEuros(parseInt(gc.budgetAmountMicros)) : null

      if (existing) {
        await prisma.campaign.update({
          where: { id: existing.id },
          data: { name: gc.name, status, budget },
        })
      } else {
        await prisma.campaign.create({
          data: {
            externalId: gc.id,
            platform: 'google',
            name: gc.name,
            status,
            budget,
            budgetType: 'daily',
            startDate: gc.startDate ? new Date(gc.startDate) : null,
            endDate: gc.endDate ? new Date(gc.endDate) : null,
          },
        })
      }
      itemCount++
    }

    // 2. Metriken der letzten 7 Tage synchen
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const metricsData = await getCampaignMetrics(customerId, startDate, endDate)

    for (const cm of metricsData) {
      // Kampagne in DB finden
      const campaign = await prisma.campaign.findFirst({
        where: { externalId: cm.campaignId },
      })

      if (campaign) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const spend = microsToEuros(cm.metrics.costMicros)
        const clicks = cm.metrics.clicks
        const impressions = cm.metrics.impressions

        await prisma.campaignMetric.upsert({
          where: {
            campaignId_date: { campaignId: campaign.id, date: today },
          },
          create: {
            campaignId: campaign.id,
            date: today,
            impressions,
            clicks,
            conversions: cm.metrics.conversions,
            spend,
            revenue: 0, // Revenue kommt aus Conversion-Tracking
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            cpc: clicks > 0 ? spend / clicks : 0,
            roas: 0,
          },
          update: {
            impressions,
            clicks,
            conversions: cm.metrics.conversions,
            spend,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            cpc: clicks > 0 ? spend / clicks : 0,
          },
        })
      }
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'success',
        itemCount,
        details: `${itemCount} Kampagnen + Metriken synchronisiert`,
        endedAt: new Date(),
      },
    })

    return NextResponse.json({ status: 'success', itemCount })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { status: 'error', details: message, endedAt: new Date() },
    })
    return NextResponse.json({ status: 'error', error: message }, { status: 500 })
  }
}
