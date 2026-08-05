import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const plan = await prisma.contentPlan.update({
      where: { id },
      data: {
        title: body.title,
        keyword: body.keyword,
        status: body.status,
        contentType: body.contentType,
        outline: body.outline,
        aiDraft: body.aiDraft,
        publishDate: body.publishDate ? new Date(body.publishDate) : undefined,
      },
    })
    return NextResponse.json(plan)
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
    await prisma.contentPlan.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 })
  }
}
