import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface CalendarEvent {
  id: string
  title: string
  date: string // ISO date string
  type: 'social' | 'followup' | 'email' | 'automation' | 'ads' | 'manual'
  status?: string
  meta?: Record<string, string>
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const now = new Date()
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()))
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1))

    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59, 999)

    const events: CalendarEvent[] = []

    // 1. Social Posts (scheduledAt in range, draft or scheduled)
    const socialPosts = await prisma.socialPost.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
        status: { in: ['draft', 'scheduled'] },
      },
      select: { id: true, platform: true, content: true, scheduledAt: true, status: true },
    })
    for (const post of socialPosts) {
      if (post.scheduledAt) {
        events.push({
          id: post.id,
          title: `${post.platform}: ${post.content.slice(0, 50)}${post.content.length > 50 ? '...' : ''}`,
          date: post.scheduledAt.toISOString(),
          type: 'social',
          status: post.status,
          meta: { platform: post.platform },
        })
      }
    }

    // 2. Follow-Ups (dueDate in range, not completed, include Lead)
    const followUps = await prisma.followUp.findMany({
      where: {
        dueDate: { gte: start, lte: end },
        completed: false,
      },
      select: {
        id: true, subject: true, dueDate: true, type: true,
        lead: { select: { company: true } },
      },
    })
    for (const fu of followUps) {
      events.push({
        id: fu.id,
        title: `${fu.lead.company}: ${fu.subject}`,
        date: fu.dueDate.toISOString(),
        type: 'followup',
        meta: { followUpType: fu.type },
      })
    }

    // 3. Email Campaigns (status=scheduled, createdAt in range)
    const emailCampaigns = await prisma.emailCampaign.findMany({
      where: {
        status: 'scheduled',
        createdAt: { gte: start, lte: end },
      },
      select: { id: true, name: true, subject: true, createdAt: true, recipientCount: true },
    })
    for (const campaign of emailCampaigns) {
      events.push({
        id: campaign.id,
        title: `${campaign.name} (${campaign.recipientCount} Empfänger)`,
        date: campaign.createdAt.toISOString(),
        type: 'email',
        status: 'scheduled',
      })
    }

    // 4. Automations (weekly_schedule, enabled → synthetic entries)
    const automations = await prisma.automation.findMany({
      where: {
        enabled: true,
        triggerType: 'weekly_schedule',
      },
      select: { id: true, name: true, triggerConfig: true },
    })
    for (const auto of automations) {
      const config = auto.triggerConfig as { dayOfWeek?: number; time?: string } | null
      if (config && typeof config.dayOfWeek === 'number') {
        // Generate synthetic entries for each matching day in the month
        const current = new Date(start)
        while (current <= end) {
          if (current.getDay() === config.dayOfWeek) {
            const dateStr = new Date(current)
            if (config.time) {
              const [h, m] = config.time.split(':').map(Number)
              dateStr.setHours(h || 0, m || 0)
            }
            events.push({
              id: `${auto.id}-${current.toISOString().slice(0, 10)}`,
              title: auto.name,
              date: dateStr.toISOString(),
              type: 'automation',
              status: 'active',
            })
          }
          current.setDate(current.getDate() + 1)
        }
      }
    }

    // 5. Ads Campaigns (startDate or endDate in range, not ended)
    const platformLabels: Record<string, string> = { google: 'Google', meta: 'Meta', tiktok: 'TikTok', snapchat: 'Snapchat' }
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: { in: ['draft', 'active', 'paused', 'scheduled'] },
        OR: [
          { startDate: { gte: start, lte: end } },
          { endDate: { gte: start, lte: end } },
          { AND: [{ startDate: { lte: start } }, { endDate: { gte: end } }] },
        ],
      },
      select: { id: true, name: true, platform: true, startDate: true, endDate: true, status: true, budget: true },
    })
    for (const c of campaigns) {
      const label = platformLabels[c.platform] || c.platform
      if (c.startDate && c.startDate >= start && c.startDate <= end) {
        events.push({
          id: `${c.id}-start`,
          title: `${label} Ads: ${c.name} (Start)`,
          date: c.startDate.toISOString(),
          type: 'ads',
          status: c.status,
          meta: { platform: c.platform },
        })
      }
      if (c.endDate && c.endDate >= start && c.endDate <= end) {
        events.push({
          id: `${c.id}-end`,
          title: `${label} Ads: ${c.name} (Ende)`,
          date: c.endDate.toISOString(),
          type: 'ads',
          status: c.status,
          meta: { platform: c.platform },
        })
      }
    }

    // 6. Manual Calendar Events
    const manualEvents = await prisma.manualCalendarEvent.findMany({
      where: { date: { gte: start, lte: end } },
      select: { id: true, title: true, description: true, date: true, color: true, notifyAt: true, notified: true },
    })
    for (const me of manualEvents) {
      events.push({
        id: me.id,
        title: me.title,
        date: me.date.toISOString(),
        type: 'manual',
        status: me.notifyAt ? (me.notified ? 'benachrichtigt' : 'Erinnerung geplant') : undefined,
        meta: {
          color: me.color,
          ...(me.description ? { description: me.description } : {}),
          ...(me.notifyAt ? { notifyAt: me.notifyAt.toISOString() } : {}),
          manual: 'true',
        },
      })
    }

    // Sort by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json({ events, year, month })
  } catch (error) {
    console.error('[Calendar] GET error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}
