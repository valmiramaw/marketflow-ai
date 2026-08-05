import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const plans = await prisma.contentPlan.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(plans)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title) {
      return NextResponse.json({ error: 'Titel erforderlich' }, { status: 400 })
    }

    const plan = await prisma.contentPlan.create({
      data: {
        title: body.title,
        keyword: body.keyword || null,
        status: body.status || 'idea',
        contentType: body.contentType || 'blog',
        outline: body.outline || null,
        publishDate: body.publishDate ? new Date(body.publishDate) : null,
      },
    })

    return NextResponse.json(plan, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 })
  }
}
