import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const competitors = await prisma.competitor.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(competitors)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: 'Name erforderlich' }, { status: 400 })
    }

    const competitor = await prisma.competitor.create({
      data: {
        name: body.name,
        website: body.website || null,
        description: body.description || null,
        industry: body.industry || null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json(competitor, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 })
  }
}
