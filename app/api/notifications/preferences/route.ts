import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MODULES = ['sales', 'seo', 'competitors', 'social', 'email', 'automations', 'reports', 'system'] as const

function getNotificationEmails(): string[] {
  const emails = process.env.NOTIFICATION_EMAILS
  if (!emails) return []
  return emails.split(',').map((e) => e.trim()).filter(Boolean)
}

export async function GET() {
  try {
    const emails = getNotificationEmails()
    if (emails.length === 0) {
      return NextResponse.json({ emails: [], modules: MODULES, preferences: {} })
    }

    const rows = await prisma.notificationPreference.findMany({
      where: { email: { in: emails } },
    })

    // Build matrix: { "user@example.com": { "sales": true, "seo": false, ... } }
    const preferences: Record<string, Record<string, boolean>> = {}
    for (const email of emails) {
      preferences[email] = {}
      for (const mod of MODULES) {
        // Default = enabled (opt-out design)
        preferences[email][mod] = true
      }
    }
    for (const row of rows) {
      if (preferences[row.email]) {
        preferences[row.email][row.module] = row.enabled
      }
    }

    return NextResponse.json({ emails, modules: MODULES, preferences })
  } catch (error) {
    console.error('[Preferences] GET error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { email, module, enabled } = await request.json()

    if (!email || !module || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'email, module und enabled erforderlich' }, { status: 400 })
    }

    if (!MODULES.includes(module)) {
      return NextResponse.json({ error: 'Ungültiges Modul' }, { status: 400 })
    }

    const pref = await prisma.notificationPreference.upsert({
      where: { email_module: { email, module } },
      update: { enabled },
      create: { email, module, enabled },
    })

    return NextResponse.json(pref)
  } catch (error) {
    console.error('[Preferences] PUT error:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }
}
