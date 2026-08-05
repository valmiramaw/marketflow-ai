import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getGoogleAccessToken } from '@/lib/integrations/google/oauth'

export async function GET(request: NextRequest) {
  // Cron-Secret prüfen
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const syncLog = await prisma.syncLog.create({
    data: { type: 'seo', provider: 'google', status: 'running' },
  })

  try {
    const token = await getGoogleAccessToken()

    if (!token) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { status: 'error', details: 'Google nicht verbunden', endedAt: new Date() },
      })
      return NextResponse.json({ status: 'skipped', reason: 'Google nicht verbunden' })
    }

    let itemCount = 0

    // 1. Search Console Daten für getrackte Keywords synchen
    const keywords = await prisma.trackedKeyword.findMany()

    if (keywords.length > 0) {
      // Domains sammeln
      const domains = [...new Set(keywords.map((k) => k.domain))]

      for (const domain of domains) {
        const siteUrl = domain.startsWith('http') ? domain : `https://${domain}`
        const domainKeywords = keywords.filter((k) => k.domain === domain)

        try {
          // Bulk-Query für alle Keywords dieser Domain
          const endDate = new Date().toISOString().split('T')[0]
          const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

          const res = await fetch(
            `https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                startDate,
                endDate,
                dimensions: ['query'],
                rowLimit: 500,
              }),
            }
          )

          if (res.ok) {
            const data = await res.json()
            const rows = data.rows || []

            for (const kw of domainKeywords) {
              const row = rows.find(
                (r: { keys: string[] }) => r.keys[0]?.toLowerCase() === kw.keyword.toLowerCase()
              )

              if (row) {
                const newRank = Math.round(row.position)
                await prisma.trackedKeyword.update({
                  where: { id: kw.id },
                  data: {
                    currentRank: newRank,
                    bestRank: kw.bestRank ? Math.min(kw.bestRank, newRank) : newRank,
                    url: undefined,
                  },
                })

                // History-Eintrag
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                await prisma.keywordHistory.upsert({
                  where: { keywordId_date: { keywordId: kw.id, date: today } },
                  create: { keywordId: kw.id, date: today, rank: newRank },
                  update: { rank: newRank },
                })

                itemCount++
              }
            }
          }
        } catch {
          // Domain übersprungen
        }
      }
    }

    // 2. GA4 Snapshot (falls Property konfiguriert)
    // TODO: GA4 Property-ID aus Settings laden
    // Für jetzt: nur Search Console Sync

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'success',
        itemCount,
        details: `${itemCount} Keywords aktualisiert`,
        endedAt: new Date(),
      },
    })

    return NextResponse.json({ status: 'success', itemCount })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { status: 'error', details: message, endedAt: new Date() },
    })
    return NextResponse.json({ status: 'error', error: message }, { status: 500 })
  }
}
