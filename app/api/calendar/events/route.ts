import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, date, color, notifyAt } = body

    if (!title || !date) {
      return NextResponse.json({ error: 'Titel und Datum erforderlich' }, { status: 400 })
    }

    const event = await prisma.manualCalendarEvent.create({
      data: {
        title,
        description: description || null,
        date: new Date(date),
        color: color || 'sky',
        notifyAt: notifyAt ? new Date(notifyAt) : null,
      },
    })

    // Sofort-Benachrichtigung wenn notifyAt in der Vergangenheit oder jetzt
    if (event.notifyAt && event.notifyAt <= new Date()) {
      await sendNotification({
        subject: `Erinnerung: ${event.title}`,
        body: event.description
          ? `${event.description}\n\nDatum: ${new Date(event.date).toLocaleString('de-DE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
          : `Datum: ${new Date(event.date).toLocaleString('de-DE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        module: 'system',
      })
      await prisma.manualCalendarEvent.update({
        where: { id: event.id },
        data: { notified: true },
      })
    }

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('[Calendar Events] POST error:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 })

    await prisma.manualCalendarEvent.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Calendar Events] DELETE error:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 })
  }
}
