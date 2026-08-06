import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Cross-Modul Dashboard-Daten
export async function GET() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Parallel alle Daten laden
  const [
    campaigns,
    campaignMetrics,
    keywords,
    leads,
    proposals,
    followUps,
    contentPlans,
    aiUsage,
    recentSyncs,
    latestReport,
  ] = await Promise.all([
    prisma.campaign.findMany({
      where: { status: { in: ['active', 'paused', 'draft'] } },
    }),
    prisma.campaignMetric.findMany({
      where: { date: { gte: thirtyDaysAgo } },
    }),
    prisma.trackedKeyword.findMany(),
    prisma.lead.findMany(),
    prisma.proposal.findMany(),
    prisma.followUp.findMany({
      where: { completed: false, dueDate: { lte: now } },
    }),
    prisma.contentPlan.findMany(),
    prisma.aiUsageLog.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.syncLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
    }),
    prisma.weeklyReport.findFirst({
      orderBy: { weekStart: 'desc' },
    }),
  ])

  // === ADS KPIs ===
  const totalAdSpend = campaignMetrics.reduce((s, m) => s + m.spend, 0)
  const totalAdRevenue = campaignMetrics.reduce((s, m) => s + m.revenue, 0)
  const totalImpressions = campaignMetrics.reduce((s, m) => s + m.impressions, 0)
  const totalClicks = campaignMetrics.reduce((s, m) => s + m.clicks, 0)
  const totalConversions = campaignMetrics.reduce((s, m) => s + m.conversions, 0)
  const overallRoas = totalAdSpend > 0 ? totalAdRevenue / totalAdSpend : 0
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length

  // === SEO KPIs ===
  const totalKeywords = keywords.length
  const top10Keywords = keywords.filter((k) => k.currentRank && k.currentRank <= 10).length
  const top3Keywords = keywords.filter((k) => k.currentRank && k.currentRank <= 3).length
  const avgRank = keywords.filter((k) => k.currentRank).length > 0
    ? keywords.filter((k) => k.currentRank).reduce((s, k) => s + (k.currentRank || 0), 0) / keywords.filter((k) => k.currentRank).length
    : 0
  const contentInProgress = contentPlans.filter((c) => c.status === 'writing').length
  const contentIdeas = contentPlans.filter((c) => c.status === 'idea').length

  // === SALES KPIs ===
  const totalLeads = leads.length
  const hotLeads = leads.filter((l) => (l.score || 0) >= 70).length
  const pipelineValue = leads
    .filter((l) => !['lost', 'won'].includes(l.status))
    .reduce((s, l) => s + (l.value || 0), 0)
  const wonDeals = leads.filter((l) => l.status === 'won')
  const wonValue = wonDeals.reduce((s, l) => s + (l.value || 0), 0)
  const totalProposals = proposals.length
  const dueFollowUps = followUps.length

  // === KI Usage ===
  const totalTokens = aiUsage.reduce((s, u) => s + u.tokens, 0)
  const totalCost = aiUsage.reduce((s, u) => s + u.cost, 0)
  const aiCalls = aiUsage.length
  const providerBreakdown = {
    claude: aiUsage.filter((u) => u.provider === 'claude').length,
    openai: aiUsage.filter((u) => u.provider === 'openai').length,
    gemini: aiUsage.filter((u) => u.provider === 'gemini').length,
  }

  return NextResponse.json({
    ads: {
      activeCampaigns,
      totalCampaigns: campaigns.length,
      totalSpend: totalAdSpend,
      totalRevenue: totalAdRevenue,
      roas: overallRoas,
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    },
    seo: {
      totalKeywords,
      top10Keywords,
      top3Keywords,
      avgRank,
      contentInProgress,
      contentIdeas,
    },
    sales: {
      totalLeads,
      hotLeads,
      pipelineValue,
      wonDeals: wonDeals.length,
      wonValue,
      totalProposals,
      dueFollowUps,
    },
    ai: {
      totalTokens,
      totalCost,
      calls: aiCalls,
      providers: providerBreakdown,
    },
    syncs: recentSyncs,
    latestReport: latestReport
      ? { id: latestReport.id, weekStart: latestReport.weekStart, createdAt: latestReport.createdAt }
      : null,
  })
}
