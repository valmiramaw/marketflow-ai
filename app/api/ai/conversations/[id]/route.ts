import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Einzelne Konversation laden (mit Messages)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const conversation = await prisma.aiConversation.findUnique({
      where: { id },
    })
    if (!conversation) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    }
    return NextResponse.json(conversation)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}
