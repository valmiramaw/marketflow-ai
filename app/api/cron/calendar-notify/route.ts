import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/email'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const due = await prisma.manualCalendarEvent.findMany({
      where: {
        notifyAt: { lte: new Date() },
        notified: false,
      },
    })

    let sent = 0
    for (const event of due) {
      const success = await sendNotification({
        subject: `Erinnerung: ${event.title}`,
        body: event.description
          ? `${event.description}\n\nDatum: ${event.date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
          : `Datum: ${event.date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        module: 'system',
        actionUrl: '/dashboard/calendar',
      })

      await prisma.manualCalendarEvent.update({
        where: { id: event.id },
        data: { notified: true },
      })

      if (success) sent++
    }

    return NextResponse.json({ processed: due.length, sent })
  } catch (error) {
    console.error('[Cron Calendar Notify] error:', error)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}
