import { NextRequest, NextResponse } from 'next/server'
import { sendNotification, isEmailConfigured } from '@/lib/email'

// GET - Status der E-Mail-Konfiguration
export async function GET() {
  return NextResponse.json({
    configured: isEmailConfigured(),
    hasApiKey: !!process.env.RESEND_API_KEY,
    hasRecipients: !!process.env.NOTIFICATION_EMAILS,
    recipientCount: (process.env.NOTIFICATION_EMAILS || '').split(',').filter(Boolean).length,
  })
}

// POST - Test-Benachrichtigung senden
export async function POST(request: NextRequest) {
  try {
    if (!isEmailConfigured()) {
      return NextResponse.json({
        error: 'E-Mail nicht konfiguriert. Setze RESEND_API_KEY und NOTIFICATION_EMAILS in .env.local',
      }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))

    const success = await sendNotification({
      subject: body.subject || 'Test-Benachrichtigung',
      body: body.body || 'Das ist eine Test-Benachrichtigung von MarketFlow AI. Wenn du diese E-Mail siehst, funktioniert alles!',
      module: 'system',
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard`,
    })

    if (success) {
      return NextResponse.json({ success: true, message: 'Test-E-Mail wurde gesendet' })
    } else {
      return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden' }, { status: 500 })
    }
  } catch {
    return NextResponse.json({ error: 'Fehler beim Senden' }, { status: 500 })
  }
}
