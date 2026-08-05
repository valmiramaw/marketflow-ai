import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Budget-Übersicht über alle Kampagnen
export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: { in: ['active', 'paused'] },
    },
    include: {
      metrics: {
        orderBy: { date: 'desc' },
        take: 30,
      },
    },
  })

  let totalBudget = 0
  let totalSpend = 0
  let totalRevenue = 0

  const budgetDetails = campaigns.map((c) => {
    const monthlyBudget = c.budget
      ? c.budgetType === 'daily'
        ? c.budget * 30
        : c.budget
      : 0

    const spend30d = c.metrics.reduce((sum, m) => sum + m.spend, 0)
    const revenue30d = c.metrics.reduce((sum, m) => sum + m.revenue, 0)
    const roas = spend30d > 0 ? revenue30d / spend30d : 0

    totalBudget += monthlyBudget
    totalSpend += spend30d
    totalRevenue += revenue30d

    return {
      id: c.id,
      name: c.name,
      platform: c.platform,
      status: c.status,
      dailyBudget: c.budgetType === 'daily' ? c.budget : c.budget ? c.budget / 30 : 0,
      monthlyBudget,
      spend30d,
      revenue30d,
      roas,
      utilization: monthlyBudget > 0 ? (spend30d / monthlyBudget) * 100 : 0,
    }
  })

  return NextResponse.json({
    summary: {
      totalBudget,
      totalSpend,
      totalRevenue,
      remaining: totalBudget - totalSpend,
      overallRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      utilization: totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0,
    },
    campaigns: budgetDetails,
  })
}
