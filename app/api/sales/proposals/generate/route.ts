import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiComplete } from '@/lib/ai/router'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.leadId) {
      return NextResponse.json({ error: 'leadId erforderlich' }, { status: 400 })
    }

    const lead = await prisma.lead.findUnique({
      where: { id: body.leadId },
      include: { activities: { orderBy: { createdAt: 'desc' }, take: 10 } },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead nicht gefunden' }, { status: 404 })
    }

    const activityContext = lead.activities
      .map((a) => `- ${a.type}: ${a.subject}${a.content ? ` (${a.content})` : ''}`)
      .join('\n')

    const result = await aiComplete({
      taskType: 'proposal_writing',
      messages: [
        {
          role: 'user',
          content: `Erstelle ein professionelles Angebot/Proposal für folgenden Lead:

Firma: ${lead.company}
Ansprechpartner: ${lead.contactName || 'Unbekannt'}
Website: ${lead.website || 'Nicht angegeben'}
Branche/Notizen: ${lead.notes || 'Keine'}
Geschätzter Wert: ${lead.value ? `€${lead.value}` : 'Noch nicht beziffert'}
KI-Profil: ${lead.aiProfile || 'Kein Profil'}

Bisherige Interaktionen:
${activityContext || 'Keine'}

${body.instructions ? `Zusätzliche Anweisungen: ${body.instructions}` : ''}

Erstelle ein Proposal mit:
1. Persönliche Ansprache
2. Verständnis der Herausforderungen des Kunden
3. Lösungsvorschlag mit konkretem Nutzen
4. Preisrahmen (falls Wert bekannt)
5. Nächste Schritte / Call-to-Action

Format: Professionell, auf Deutsch, markdown-formatiert.`,
        },
      ],
      systemPrompt: 'Du bist ein erfahrener Sales-Experte der überzeugende, maßgeschneiderte Proposals schreibt. Schreibe auf Deutsch.',
    })

    const proposal = await prisma.proposal.create({
      data: {
        leadId: lead.id,
        title: `Proposal für ${lead.company}`,
        content: result.content,
        value: lead.value,
        status: 'draft',
      },
    })

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'note',
        subject: `KI-Proposal erstellt: ${proposal.title}`,
      },
    })

    return NextResponse.json(proposal, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proposal-Generierung fehlgeschlagen'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
