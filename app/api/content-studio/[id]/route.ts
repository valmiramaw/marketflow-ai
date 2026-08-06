import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const content = await prisma.productContent.update({
      where: { id },
      data: {
        title: body.title,
        productName: body.productName,
        status: body.status,
        generatedContent: body.generatedContent,
        keyword: body.keyword,
        prompt: body.prompt,
        language: body.language,
      },
    })
    return NextResponse.json(content)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await prisma.productContent.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 })
  }
}
