import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Alle Konversationen laden
export async function GET() {
  try {
    const conversations = await prisma.aiConversation.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        module: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return NextResponse.json(conversations)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}

// POST - Neue Konversation erstellen oder bestehende aktualisieren
export async function POST(request: NextRequest) {
  try {
    const { id, title, messages, module } = await request.json()

    if (id) {
      // Bestehende Konversation aktualisieren
      const updated = await prisma.aiConversation.update({
        where: { id },
        data: {
          title: title || undefined,
          messages,
          module: module || undefined,
        },
      })
      return NextResponse.json(updated)
    }

    // Neue Konversation erstellen
    const conversation = await prisma.aiConversation.create({
      data: {
        title: title || 'Neuer Chat',
        messages: messages || [],
        module: module || 'general',
      },
    })
    return NextResponse.json(conversation)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }
}

// DELETE - Konversation löschen
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })
    }

    await prisma.aiConversation.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 })
  }
}
