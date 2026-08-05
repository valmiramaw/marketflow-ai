import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        activities: { orderBy: { createdAt: 'desc' }, take: 50 },
        followUps: { orderBy: { dueDate: 'asc' } },
        proposals: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()

    const oldLead = await prisma.lead.findUnique({ where: { id } })
    if (!oldLead) {
      return NextResponse.json({ error: 'Lead nicht gefunden' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    const allowedFields = [
      'company', 'contactName', 'email', 'phone', 'website',
      'source', 'status', 'value', 'notes',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field]
    }

    // Status-spezifische Felder
    if (body.status === 'won' && oldLead.status !== 'won') {
      data.wonAt = new Date()
    }
    if (body.status === 'lost' && oldLead.status !== 'lost') {
      data.lostAt = new Date()
      if (body.lostReason) data.lostReason = body.lostReason
    }

    const lead = await prisma.lead.update({ where: { id }, data })

    // Activity loggen bei Status-Änderung
    if (body.status && body.status !== oldLead.status) {
      await prisma.leadActivity.create({
        data: {
          leadId: id,
          type: 'status_change',
          subject: `Status: ${oldLead.status} → ${body.status}`,
          content: body.lostReason || null,
        },
      })
    }

    return NextResponse.json(lead)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await prisma.lead.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 })
  }
}
