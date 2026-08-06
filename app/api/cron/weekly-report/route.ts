import { NextRequest, NextResponse } from 'next/server'

// Cron Job: Montags 09:00 - Wochenbericht generieren
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Report-API aufrufen (intern)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/reports`, { method: 'POST' })

  if (res.ok) {
    const report = await res.json()
    return NextResponse.json({ status: 'success', reportId: report.id })
  }

  return NextResponse.json({ status: 'error' }, { status: 500 })
}
