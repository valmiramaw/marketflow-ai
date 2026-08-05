import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const keywords = await prisma.trackedKeyword.findMany({
      orderBy: [{ currentRank: 'asc' }],
      include: {
        history: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    })
    return NextResponse.json(keywords)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.keyword || !body.domain) {
      return NextResponse.json({ error: 'Keyword und Domain erforderlich' }, { status: 400 })
    }

    const keyword = await prisma.trackedKeyword.create({
      data: {
        keyword: body.keyword.toLowerCase().trim(),
        domain: body.domain.toLowerCase().trim(),
        location: body.location || 'DE',
        language: body.language || 'de',
        searchVolume: body.searchVolume || null,
        difficulty: body.difficulty || null,
      },
    })

    return NextResponse.json(keyword, { status: 201 })
  } catch (error) {
    if (String(error).includes('Unique constraint')) {
      return NextResponse.json({ error: 'Keyword wird bereits getrackt' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 })
  }
}
