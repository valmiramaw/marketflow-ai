import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const leadId = searchParams.get('leadId')
  const pending = searchParams.get('pending')

  try {
    const where: Record<string, unknown> = {}
    if (leadId) where.leadId = leadId
    if (pending === 'true') {
      where.completed = false
      where.dueDate = { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } // nächste 7 Tage
    }

    const followUps = await prisma.followUp.findMany({
      where,
      include: { lead: { select: { id: true, company: true, contactName: true } } },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json(followUps)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.leadId || !body.subject || !body.dueDate || !body.type) {
      return NextResponse.json({ error: 'leadId, subject, dueDate und type erforderlich' }, { status: 400 })
    }

    const followUp = await prisma.followUp.create({
      data: {
        leadId: body.leadId,
        dueDate: new Date(body.dueDate),
        type: body.type,
        subject: body.subject,
        description: body.description || null,
      },
    })

    // Lead nextFollowUp aktualisieren
    await prisma.lead.update({
      where: { id: body.leadId },
      data: { nextFollowUp: new Date(body.dueDate) },
    })

    await prisma.leadActivity.create({
      data: {
        leadId: body.leadId,
        type: 'note',
        subject: `Follow-up geplant: ${body.subject}`,
        content: `${body.type} am ${new Date(body.dueDate).toLocaleDateString('de-DE')}`,
      },
    })

    return NextResponse.json(followUp, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 })
    }

    const followUp = await prisma.followUp.update({
      where: { id: body.id },
      data: {
        completed: body.completed ?? undefined,
        completedAt: body.completed ? new Date() : null,
      },
    })

    if (body.completed) {
      await prisma.leadActivity.create({
        data: {
          leadId: followUp.leadId,
          type: followUp.type,
          subject: `Follow-up erledigt: ${followUp.subject}`,
        },
      })

      // Nächstes offenes Follow-up suchen
      const next = await prisma.followUp.findFirst({
        where: { leadId: followUp.leadId, completed: false },
        orderBy: { dueDate: 'asc' },
      })
      await prisma.lead.update({
        where: { id: followUp.leadId },
        data: { nextFollowUp: next?.dueDate || null },
      })
    }

    return NextResponse.json(followUp)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 })
  }
}
