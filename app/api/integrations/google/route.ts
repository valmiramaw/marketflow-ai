import { NextResponse } from 'next/server'
import { getGoogleAuthUrl } from '@/lib/integrations/google/oauth'
import { prisma } from '@/lib/prisma'

// GET: OAuth-Status prüfen oder Auth-URL generieren
export async function GET() {
  try {
    const token = await prisma.oAuthToken.findFirst({
      where: { provider: 'google' },
      orderBy: { updatedAt: 'desc' },
    })

    if (token) {
      return NextResponse.json({
        connected: true,
        accountName: token.accountName,
        accountId: token.accountId,
        scopes: token.scopes,
        expiresAt: token.expiresAt,
      })
    }

    return NextResponse.json({ connected: false })
  } catch {
    return NextResponse.json({ connected: false })
  }
}

// POST: Auth-URL generieren
export async function POST() {
  try {
    const url = getGoogleAuthUrl()
    return NextResponse.json({ url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OAuth Fehler'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE: Verbindung trennen
export async function DELETE() {
  try {
    await prisma.oAuthToken.deleteMany({ where: { provider: 'google' } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Trennen' }, { status: 500 })
  }
}
