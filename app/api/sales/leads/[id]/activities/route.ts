import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()

    if (!body.type || !body.subject) {
      return NextResponse.json({ error: 'Typ und Betreff erforderlich' }, { status: 400 })
    }

    const activity = await prisma.leadActivity.create({
      data: {
        leadId: id,
        type: body.type,
        subject: body.subject,
        content: body.content || null,
        metadata: body.metadata || null,
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 })
  }
}
