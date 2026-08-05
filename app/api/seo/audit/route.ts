import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiComplete } from '@/lib/ai/router'

export async function GET() {
  try {
    const audits = await prisma.seoAudit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    return NextResponse.json(audits)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.domain) {
      return NextResponse.json({ error: 'Domain erforderlich' }, { status: 400 })
    }

    // KI-basiertes SEO-Audit
    const result = await aiComplete({
      taskType: 'data_extraction',
      messages: [
        {
          role: 'user',
          content: `Führe ein SEO-Audit für die Domain "${body.domain}" durch.
Analysiere die typischen SEO-Faktoren und erstelle einen Report.

Antworte als JSON mit folgendem Format:
{
  "score": <number 0-100>,
  "issues": {
    "critical": ["issue1", "issue2"],
    "warning": ["issue1", "issue2"],
    "info": ["issue1"]
  },
  "performance": {
    "lcp": "<Schätzung>",
    "fid": "<Schätzung>",
    "cls": "<Schätzung>",
    "ttfb": "<Schätzung>"
  },
  "summary": "<2-3 Sätze Zusammenfassung>"
}

Basiere die Analyse auf allgemeinen Best Practices. Sei realistisch bei der Bewertung.`,
        },
      ],
      jsonMode: true,
      systemPrompt: 'Du bist ein technischer SEO-Experte. Erstelle realistische SEO-Audits. Antworte nur als JSON.',
    })

    const parsed = JSON.parse(result.content)

    const audit = await prisma.seoAudit.create({
      data: {
        domain: body.domain.toLowerCase().trim(),
        score: parsed.score,
        issues: parsed.issues,
        performance: parsed.performance,
        aiSummary: parsed.summary,
      },
    })

    return NextResponse.json(audit, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Audit fehlgeschlagen'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
