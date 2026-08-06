import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - KI-Usage Statistiken
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  const since = new Date()
  since.setDate(since.getDate() - days)

  const logs = await prisma.aiUsageLog.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
  })

  // Provider-Aufschlüsselung
  const byProvider = ['claude', 'openai', 'gemini'].map((provider) => {
    const providerLogs = logs.filter((l) => l.provider === provider)
    return {
      provider,
      calls: providerLogs.length,
      tokens: providerLogs.reduce((s, l) => s + l.tokens, 0),
      cost: providerLogs.reduce((s, l) => s + l.cost, 0),
      avgDuration: providerLogs.length > 0
        ? Math.round(providerLogs.reduce((s, l) => s + l.duration, 0) / providerLogs.length)
        : 0,
      errors: providerLogs.filter((l) => !l.success).length,
    }
  })

  // Task-Type-Aufschlüsselung
  const taskTypes = [...new Set(logs.map((l) => l.taskType))]
  const byTaskType = taskTypes.map((taskType) => {
    const typeLogs = logs.filter((l) => l.taskType === taskType)
    return {
      taskType,
      calls: typeLogs.length,
      tokens: typeLogs.reduce((s, l) => s + l.tokens, 0),
      cost: typeLogs.reduce((s, l) => s + l.cost, 0),
    }
  }).sort((a, b) => b.calls - a.calls)

  // Tägliche Nutzung
  const dailyMap = new Map<string, { calls: number; tokens: number; cost: number }>()
  for (const log of logs) {
    const day = log.createdAt.toISOString().split('T')[0]
    const existing = dailyMap.get(day) || { calls: 0, tokens: 0, cost: 0 }
    dailyMap.set(day, {
      calls: existing.calls + 1,
      tokens: existing.tokens + log.tokens,
      cost: existing.cost + log.cost,
    })
  }
  const daily = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Gesamtstatistiken
  const totalCalls = logs.length
  const totalTokens = logs.reduce((s, l) => s + l.tokens, 0)
  const totalCost = logs.reduce((s, l) => s + l.cost, 0)
  const avgDuration = totalCalls > 0
    ? Math.round(logs.reduce((s, l) => s + l.duration, 0) / totalCalls)
    : 0
  const errorRate = totalCalls > 0
    ? (logs.filter((l) => !l.success).length / totalCalls) * 100
    : 0

  // Letzte 20 Calls
  const recent = logs.slice(0, 20).map((l) => ({
    id: l.id,
    provider: l.provider,
    model: l.model,
    taskType: l.taskType,
    tokens: l.tokens,
    cost: l.cost,
    duration: l.duration,
    success: l.success,
    error: l.error,
    createdAt: l.createdAt,
  }))

  return NextResponse.json({
    summary: {
      totalCalls,
      totalTokens,
      totalCost,
      avgDuration,
      errorRate,
      period: `${days} Tage`,
    },
    byProvider,
    byTaskType,
    daily,
    recent,
  })
}
