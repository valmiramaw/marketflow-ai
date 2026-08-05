import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiComplete } from '@/lib/ai/router'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { activities: { orderBy: { createdAt: 'desc' }, take: 10 } },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead nicht gefunden' }, { status: 404 })
    }

    const activitySummary = lead.activities
      .map((a) => `- ${a.type}: ${a.subject}`)
      .join('\n')

    const result = await aiComplete({
      taskType: 'lead_scoring',
      messages: [
        {
          role: 'user',
          content: `Bewerte diesen Lead auf einer Skala von 0-100 und erstelle ein aktualisiertes Firmenprofil.

Lead-Daten:
- Firma: ${lead.company}
- Kontakt: ${lead.contactName || 'Unbekannt'}
- E-Mail: ${lead.email || 'Keine'}
- Website: ${lead.website || 'Keine'}
- Quelle: ${lead.source || 'Unbekannt'}
- Status: ${lead.status}
- Geschätzter Wert: ${lead.value ? `€${lead.value}` : 'Unbekannt'}
- Notizen: ${lead.notes || 'Keine'}
- Erstellt: ${lead.createdAt}

Aktivitäten:
${activitySummary || 'Keine Aktivitäten'}

Antworte als JSON: { "score": number, "profile": "string mit 2-3 Sätzen", "recommendation": "string mit konkreter nächster Aktion" }`,
        },
      ],
      jsonMode: true,
      systemPrompt: 'Du bist ein Sales-Analyst. Bewerte Leads objektiv basierend auf allen verfügbaren Daten. Antworte nur als JSON.',
    })

    const parsed = JSON.parse(result.content)

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        score: Math.min(100, Math.max(0, parsed.score)),
        aiProfile: parsed.profile + (parsed.recommendation ? `\n\nEmpfehlung: ${parsed.recommendation}` : ''),
      },
    })

    await prisma.leadActivity.create({
      data: {
        leadId: id,
        type: 'note',
        subject: `KI-Scoring: ${parsed.score}/100`,
        content: parsed.recommendation || null,
      },
    })

    return NextResponse.json({
      score: updated.score,
      aiProfile: updated.aiProfile,
      recommendation: parsed.recommendation,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'KI-Scoring fehlgeschlagen'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
