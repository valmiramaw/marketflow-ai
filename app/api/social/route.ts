import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (platform) where.platform = platform
    if (status) where.status = status

    const posts = await prisma.socialPost.findMany({
      where,
      include: { productContent: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(posts)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.platform || !body.content) {
      return NextResponse.json({ error: 'Plattform und Inhalt erforderlich' }, { status: 400 })
    }

    const post = await prisma.socialPost.create({
      data: {
        platform: body.platform,
        content: body.content,
        hashtags: body.hashtags || null,
        mediaUrl: body.mediaUrl || null,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        status: body.scheduledAt ? 'scheduled' : 'draft',
        productContentId: body.productContentId || null,
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 })
  }
}
