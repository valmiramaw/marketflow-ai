import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiComplete } from '@/lib/ai/router'
import { sendNotification } from '@/lib/email'

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(leads)
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.company) {
      return NextResponse.json({ error: 'Firmenname erforderlich' }, { status: 400 })
    }

    // Lead erstellen
    const lead = await prisma.lead.create({
      data: {
        company: body.company,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        website: body.website,
        source: body.source,
        notes: body.notes,
        value: body.value,
        status: 'new',
      },
    })

    // KI-Scoring (async, fire-and-forget)
    scoreLead(lead.id, body).catch(() => {})

    // Benachrichtigung (async, fire-and-forget)
    sendNotification({
      subject: `Neuer Lead: ${body.company}`,
      body: `Ein neuer Lead wurde erstellt.\n\nFirma: ${body.company}\nKontakt: ${body.contactName || '–'}\nE-Mail: ${body.email || '–'}\nQuelle: ${body.source || '–'}\nGeschätzter Wert: ${body.value ? `€${body.value}` : '–'}`,
      module: 'sales',
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/sales/leads`,
    }).catch(() => {})

    // Activity loggen
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'status_change',
        subject: 'Lead erstellt',
        content: `Neuer Lead: ${body.company}`,
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 })
  }
}

async function scoreLead(leadId: string, leadData: Record<string, unknown>) {
  try {
    const result = await aiComplete({
      taskType: 'lead_scoring',
      messages: [
        {
          role: 'user',
          content: `Bewerte diesen Lead auf einer Skala von 0-100 und erstelle ein kurzes Firmenprofil.

Lead-Daten:
- Firma: ${leadData.company}
- Kontakt: ${leadData.contactName || 'Unbekannt'}
- E-Mail: ${leadData.email || 'Keine'}
- Website: ${leadData.website || 'Keine'}
- Quelle: ${leadData.source || 'Unbekannt'}
- Geschätzter Wert: ${leadData.value ? `€${leadData.value}` : 'Unbekannt'}
- Notizen: ${leadData.notes || 'Keine'}

Antworte als JSON: { "score": number, "profile": "string mit 2-3 Sätzen" }`,
        },
      ],
      jsonMode: true,
      systemPrompt: 'Du bist ein Sales-Analyst. Bewerte Leads objektiv. Antworte nur als JSON.',
    })

    const parsed = JSON.parse(result.content)
    const score = Math.min(100, Math.max(0, parsed.score))
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        score,
        aiProfile: parsed.profile,
      },
    })

    // Benachrichtigung bei hohem Score
    if (score >= 80) {
      sendNotification({
        subject: `🔥 High-Score Lead: ${leadData.company} (${score}/100)`,
        body: `Der Lead "${leadData.company}" hat einen KI-Score von ${score}/100 erhalten.\n\n${parsed.profile || ''}\n\nDieser Lead verdient besondere Aufmerksamkeit!`,
        module: 'sales',
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/sales/leads`,
      }).catch(() => {})
    }
  } catch {
    // Scoring fehlgeschlagen, Lead existiert trotzdem
  }
}
