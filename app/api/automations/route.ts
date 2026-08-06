import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const automations = await prisma.automation.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(automations)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name || !body.triggerType) {
      return NextResponse.json({ error: 'Name und Trigger-Typ erforderlich' }, { status: 400 })
    }

    const automation = await prisma.automation.create({
      data: {
        name: body.name,
        description: body.description || null,
        triggerType: body.triggerType,
        triggerConfig: body.triggerConfig || {},
        actions: body.actions || [],
        enabled: false,
      },
    })

    return NextResponse.json(automation, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 })
  }
}
