import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiComplete } from '@/lib/ai/router'
import { getBrandContext, formatBrandSystemPrompt } from '@/lib/brand-context'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const competitor = await prisma.competitor.findUnique({ where: { id } })

    if (!competitor) {
      return NextResponse.json({ error: 'Wettbewerber nicht gefunden' }, { status: 404 })
    }

    const brand = await getBrandContext()
    let systemPrompt = 'Du bist ein Marktanalyst und Wettbewerbsstratege. Analysiere Wettbewerber gründlich und liefere actionable Insights.'
    if (brand) {
      systemPrompt += '\n\n' + formatBrandSystemPrompt(brand)
      systemPrompt += '\n\nVergleiche den Wettbewerber mit der eigenen Marke und identifiziere Differenzierungspotenziale.'
    }

    const result = await aiComplete({
      taskType: 'competitor_analysis',
      messages: [
        {
          role: 'user',
          content: `Analysiere diesen Wettbewerber:

Name: ${competitor.name}
Website: ${competitor.website || 'Nicht angegeben'}
Branche: ${competitor.industry || 'Nicht angegeben'}
Beschreibung: ${competitor.description || 'Keine'}
Notizen: ${competitor.notes || 'Keine'}

Erstelle eine strukturierte Analyse mit folgenden Abschnitten:

**Stärken:** (3-5 Punkte)
**Schwächen:** (3-5 Punkte)
**Marktpositionierung:** (1-2 Sätze)
**Preissegment:** (Einschätzung)
**Differenzierungschancen:** (3-5 konkrete Empfehlungen)
**Strategische Empfehlungen:** (2-3 Handlungsempfehlungen)`,
        },
      ],
      systemPrompt,
      temperature: 0.7,
    })

    const updated = await prisma.competitor.update({
      where: { id },
      data: {
        aiAnalysis: result.content,
        lastAnalyzedAt: new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Fehler bei der Analyse' }, { status: 500 })
  }
}
