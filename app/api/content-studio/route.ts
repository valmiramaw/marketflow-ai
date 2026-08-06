import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('contentType')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (contentType) where.contentType = contentType
    if (status) where.status = status

    const contents = await prisma.productContent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(contents)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title || !body.contentType) {
      return NextResponse.json({ error: 'Titel und Content-Typ erforderlich' }, { status: 400 })
    }

    const content = await prisma.productContent.create({
      data: {
        title: body.title,
        productName: body.productName || null,
        contentType: body.contentType,
        language: body.language || 'de',
        keyword: body.keyword || null,
        prompt: body.prompt || null,
      },
    })

    return NextResponse.json(content, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 })
  }
}
